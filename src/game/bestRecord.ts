/**
 * 모드별 베스트(최단 클리어) 기록의 저장 키와 판정 헬퍼입니다.
 * 저장은 ait/storage를 통해 App에서 수행하고, 여기는 순수 로직만 둡니다.
 */

import type { GameMode } from "./mode";

export const CLASSIC_BEST_KEY = "match-picture/best-seconds";
const DAILY_BEST_PREFIX = "match-picture/daily-best/";

/** 데일리 챌린지의 날짜별 베스트 기록 키입니다. */
export function dailyBestKey(dateString: string): string {
  return `${DAILY_BEST_PREFIX}${dateString}`;
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
  return gap !== null && gap <= NEAR_MISS_THRESHOLD_SECONDS;
}
