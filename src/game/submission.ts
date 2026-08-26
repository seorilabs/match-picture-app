/**
 * 기록 제출 정책입니다.
 *
 * 글로벌 리더보드는 "보조 없이, 같은 조건에서, 한 번 세운 기록"만 받습니다.
 * - 도전장·스테이지: 공유 고정 덱/개별 목표라 제출하지 않습니다.
 * - 데일리: 그날의 첫 클리어만 제출합니다(재도전은 고정 덱 암기 이점).
 * - 지난 날짜 아카이브 데일리: 제출하지 않습니다.
 * - 클래식: 코인 파워업을 쓴 판은 제출하지 않고 개인 베스트도 갱신하지 않습니다.
 */

import type { GameMode } from "./mode";

export interface ClearSubmissionContext {
  mode: GameMode;
  /** 원격 설정으로 리더보드 자체가 켜져 있는지. */
  leaderboardEnabled: boolean;
  /** 이번 판에서 사용한 코인 파워업 횟수. */
  powerUpUseCount: number;
  /** 같은 날짜의 데일리 기록을 이미 제출했는지. */
  dailyAlreadySubmitted: boolean;
  /** 발행 당일이 아닌 지난 데일리 덱인지. */
  archivedDaily: boolean;
}

export type SubmissionBlockReason =
  | "disabled"
  | "unranked-mode"
  | "power-up-used"
  | "daily-retry"
  | "archived-daily";

export interface SubmissionDecision {
  submit: boolean;
  reason: SubmissionBlockReason | null;
}

export function decideSubmission({
  mode,
  leaderboardEnabled,
  powerUpUseCount,
  dailyAlreadySubmitted,
  archivedDaily,
}: ClearSubmissionContext): SubmissionDecision {
  if (!leaderboardEnabled) return { submit: false, reason: "disabled" };
  if (mode === "challenge" || mode === "stage") {
    return { submit: false, reason: "unranked-mode" };
  }
  if (mode === "classic" && powerUpUseCount > 0) {
    return { submit: false, reason: "power-up-used" };
  }
  if (mode === "daily") {
    if (archivedDaily) return { submit: false, reason: "archived-daily" };
    if (dailyAlreadySubmitted) return { submit: false, reason: "daily-retry" };
  }
  return { submit: true, reason: null };
}

/**
 * 개인 베스트 기록을 갱신해도 되는 판인지 판정합니다.
 * 파워업으로 시간을 단축한 클래식 런은 베스트에서도 제외합니다.
 */
export function canUpdateBestRecord(
  mode: GameMode,
  powerUpUseCount: number,
): boolean {
  if (mode === "classic") return powerUpUseCount === 0;
  return mode === "daily";
}
