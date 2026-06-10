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
