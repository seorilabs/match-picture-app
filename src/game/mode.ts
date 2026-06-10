/**
 * 게임 모드와 시드 결정 로직입니다.
 *
 * - `classic`: 매판 무작위 덱. 기존 동작과 동일합니다.
 * - `daily`: KST 날짜 기반 시드로 모든 사용자가 같은 "오늘의 덱"을 플레이합니다.
 * - `challenge`: 공유 링크(`?challengeSeed=`)로 받은 시드 덱으로 상대 기록에 도전합니다.
 */

import { hashSeed, MAX_SEED } from "./rng";

export type GameMode = "classic" | "daily" | "challenge";

/** 도전장 링크에 실리는 쿼리 파라미터 이름입니다. */
export const CHALLENGE_SEED_PARAM = "challengeSeed";
export const CHALLENGE_TARGET_PARAM = "challengeTarget";

/** 도전장 목표 기록(초)의 상한. rules의 MAX_DISPLAY_SECONDS보다 넉넉히 잡습니다. */
const MAX_TARGET_SECONDS = 9999;

export interface ChallengeParams {
  seed: number;
  /** 도전 대상 기록(초). 링크에 없으면 null이고 덱 대결만 합니다. */
  targetSeconds: number | null;
}

/**
 * KST(UTC+9) 기준 오늘 날짜를 `YYYY-MM-DD`로 돌려줍니다.
 * 데일리 챌린지는 한국 사용자 기준 자정에 갱신되어야 하므로 기기 타임존을 쓰지 않습니다.
 */
export function getKstDateString(now: Date = new Date()): string {
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

/** 날짜 문자열에서 데일리 덱 시드를 만듭니다. 같은 날짜는 항상 같은 시드입니다. */
export function getDailySeed(dateString: string): number {
  return hashSeed(`match-picture-daily-${dateString}`);
}

/** "6/10" 같은 짧은 표기. 데일리 칩에 노출합니다. */
export function formatDailyLabel(dateString: string): string {
  const [, month, day] = dateString.split("-");
  return `${Number(month)}/${Number(day)}`;
}

/**
 * URL 쿼리에서 도전장 파라미터를 파싱합니다.
 * 시드가 유효한 32비트 정수가 아니면 도전장 전체를 무시합니다(null 반환).
 */
export function parseChallengeParams(search: string): ChallengeParams | null {
  let params: URLSearchParams;
  try {
    params = new URLSearchParams(search);
  } catch {
    return null;
  }

  const rawSeed = params.get(CHALLENGE_SEED_PARAM);
  if (rawSeed === null) return null;
  const seed = Number(rawSeed.trim());
  if (!Number.isInteger(seed) || seed < 0 || seed > MAX_SEED) return null;

  const rawTarget = params.get(CHALLENGE_TARGET_PARAM);
  let targetSeconds: number | null = null;
  if (rawTarget !== null) {
    const target = Number(rawTarget.trim());
    if (Number.isFinite(target) && target > 0 && target <= MAX_TARGET_SECONDS) {
      targetSeconds = target;
    }
  }

  return { seed, targetSeconds };
}

/** 현재 페이지 URL에서 도전장 파라미터를 읽습니다. production에서도 동작합니다. */
export function getChallengeParamsFromLocation(): ChallengeParams | null {
  if (typeof window === "undefined") return null;
  return parseChallengeParams(window.location.search);
}
