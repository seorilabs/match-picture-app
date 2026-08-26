/**
 * 게임 모드와 시드 결정 로직입니다.
 *
 * - `classic`: 매판 무작위 덱. 기존 동작과 동일합니다.
 * - `daily`: KST 날짜 기반 시드로 모든 사용자가 같은 "오늘의 덱"을 플레이합니다.
 * - `challenge`: 공유 링크(`?challengeSeed=`)로 받은 시드 덱으로 상대 기록에 도전합니다.
 * - `stage`: 순차 해금되는 스테이지를 별점 목표로 클리어합니다.
 */

import { hashSeed, MAX_SEED } from "./rng";

export type GameMode = "classic" | "daily" | "challenge" | "stage";

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

/** 하루의 밀리초 길이입니다. */
const DAY_MS = 24 * 60 * 60 * 1000;

/** KST 자정 기준으로 다음 데일리 덱이 열릴 때까지 남은 밀리초입니다. */
export function msUntilNextDaily(now: Date = new Date()): number {
  const kstMs = now.getTime() + 9 * 60 * 60 * 1000;
  const sinceMidnight = ((kstMs % DAY_MS) + DAY_MS) % DAY_MS;
  return DAY_MS - sinceMidnight;
}

/** `HH:MM:SS` 카운트다운 표기를 만듭니다. 0 이하이면 `00:00:00`입니다. */
export function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

/** 오늘부터 과거로 `count`일치 날짜 문자열을 최신순으로 만듭니다(데일리 아카이브). */
export function recentDailyDates(
  count: number,
  now: Date = new Date(),
): string[] {
  const dates: string[] = [];
  for (let offset = 0; offset < Math.max(0, count); offset++) {
    dates.push(getKstDateString(new Date(now.getTime() - offset * DAY_MS)));
  }
  return dates;
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
  // Number("")는 0이 되므로 빈 값/공백을 먼저 거르고, 10진 양의 정수 표기만 허용합니다.
  const trimmedSeed = rawSeed.trim();
  if (!/^\d+$/.test(trimmedSeed)) return null;
  const seed = Number(trimmedSeed);
  if (!Number.isInteger(seed) || seed > MAX_SEED) return null;

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

/**
 * 도전장 파라미터를 한 번만 소비합니다.
 *
 * 읽은 뒤 주소에서 쿼리를 지워, 이후 홈에서 시작한 클래식/데일리 판이
 * 남아 있는 쿼리 때문에 도전장 모드로 끌려가지 않게 합니다.
 */
export function consumeChallengeParamsFromLocation(): ChallengeParams | null {
  const params = getChallengeParamsFromLocation();
  if (params === null || typeof window === "undefined") return params;
  try {
    window.history.replaceState(null, "", window.location.pathname);
  } catch {
    // history API를 못 쓰는 환경에서도 게임 진입은 막지 않습니다.
  }
  return params;
}
