/**
 * 모드별 베스트(최단 클리어) 기록의 저장 키와 판정 헬퍼입니다.
 * 저장은 ait/storage를 통해 App에서 수행하고, 여기는 순수 로직만 둡니다.
 */

import type { GameMode } from "./mode";

export const CLASSIC_BEST_KEY = "match-picture/best-seconds";
const DAILY_BEST_PREFIX = "match-picture/daily-best/";
const DAILY_SUBMITTED_PREFIX = "match-picture/daily-submitted/";
const DAILY_LATE_PREFIX = "match-picture/daily-late/";

/** 데일리 챌린지의 날짜별 베스트 기록 키입니다. */
export function dailyBestKey(dateString: string): string {
  return `${DAILY_BEST_PREFIX}${dateString}`;
}

/**
 * 그날의 데일리 기록을 이미 글로벌 리더보드에 올렸는지 기록하는 키입니다.
 * 고정 덱을 반복 학습한 재도전 기록이 리더보드를 오염시키지 않게 합니다.
 */
export function dailySubmittedKey(dateString: string): string {
  return `${DAILY_SUBMITTED_PREFIX}${dateString}`;
}

/** 발행 당일이 아니라 나중에 클리어한 데일리인지 표시하는 키입니다(아카이브 배지). */
export function dailyLateClearKey(dateString: string): string {
  return `${DAILY_LATE_PREFIX}${dateString}`;
}

/**
 * 모드별 베스트 기록 저장 키. 데일리는 날짜마다 별도 기록을 가집니다.
 * 도전장 모드는 공유받은 고정 덱이라 기록을 남기지 않습니다(null).
 */
export function bestRecordKey(
  mode: GameMode,
  dailyDateString: string,
): string | null {
  if (mode === "classic") return CLASSIC_BEST_KEY;
  if (mode === "daily") return dailyBestKey(dailyDateString);
  // 도전장(공유 고정 덱)과 스테이지(스테이지별 별점으로 따로 기록)는 시간 기록을 남기지 않습니다.
  return null;
}

/** 저장된 기록 문자열을 초(실수)로 파싱합니다. 손상된 값은 null. */
export function parseBestSeconds(value: string | null): number | null {
  if (value === null) return null;
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  return seconds;
}

/** 새 기록이 기존 베스트보다 빠른지 판정합니다. 기존 기록이 없으면 신기록입니다. */
export function isNewBest(
  resultSeconds: number,
  previousBest: number | null,
): boolean {
  if (!Number.isFinite(resultSeconds) || resultSeconds <= 0) return false;
  return previousBest === null || resultSeconds < previousBest;
}

/** 이 차이(초) 이하로 베스트에 못 미치면 "아깝다" 강조를 보여줍니다. */
export const NEAR_MISS_THRESHOLD_SECONDS = 2.5;

/** 부동소수점 뺄셈 오차로 경계값(정확히 2.5초)이 빗나가지 않게 하는 허용 오차. */
const NEAR_MISS_EPSILON_SECONDS = 1e-9;

/**
 * 베스트에 얼마나 못 미쳤는지(초)를 돌려줍니다.
 * 신기록이거나 비교할 베스트가 없으면 null입니다.
 */
export function bestGapSeconds(
  resultSeconds: number,
  previousBest: number | null,
): number | null {
  if (previousBest === null) return null;
  if (!Number.isFinite(resultSeconds) || resultSeconds <= 0) return null;
  const gap = resultSeconds - previousBest;
  return gap > 0 ? gap : null;
}

/** 베스트를 아깝게 놓친 기록인지 판정합니다. RETRY를 유도하는 강조에 사용합니다. */
export function isNearMiss(
  resultSeconds: number,
  previousBest: number | null,
): boolean {
  const gap = bestGapSeconds(resultSeconds, previousBest);
  return (
    gap !== null && gap <= NEAR_MISS_THRESHOLD_SECONDS + NEAR_MISS_EPSILON_SECONDS
  );
}
