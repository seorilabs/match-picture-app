import {
  isMinVersionSupported,
  openGameCenterLeaderboard,
  submitGameCenterLeaderBoardScore,
} from "@apps-in-toss/web-framework";

import { MAX_DISPLAY_SECONDS } from "../game/rules";

const LEADERBOARD_ENABLED =
  (import.meta.env.VITE_ENABLE_LEADERBOARD ?? "").trim().toLowerCase() ===
  "true";

const GAME_CENTER_MIN_VERSION = {
  android: "5.221.0",
  ios: "5.221.0",
} as const;

const SCORE_BASE = MAX_DISPLAY_SECONDS + 1;

function formatScore(score: number): string {
  return score.toFixed(3).replace(/\.?0+$/, "");
}

export function isLeaderboardEnabled(): boolean {
  return LEADERBOARD_ENABLED;
}

/**
 * Apps in Toss 리더보드는 내림차순 정렬만 지원하므로 클리어 시간이 짧을수록
 * 큰 점수가 되도록 변환합니다. 예: 18.42초 -> 981.58점.
 */
export function clearTimeToLeaderboardScore(seconds: number): string {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  return formatScore(Math.max(0, SCORE_BASE - safeSeconds));
}

/**
 * Apps in Toss 게임 센터 리더보드에 점수를 제출합니다.
 *
 * 같은그림찾기는 "짧을수록 좋은 시간 기록"이므로 리더보드에는 실제 초가 아닌
 * `1000 - 클리어시간(초)` 형태의 점수를 보냅니다. 내림차순 정렬에서도 빠른
 * 기록이 위에 오도록 하기 위한 변환입니다.
 *
 * Apps in Toss 환경이 아니거나 미지원 버전이면 조용히 실패합니다.
 */
export async function submitClearTime(seconds: number): Promise<
  | "SUCCESS"
  | "LEADERBOARD_NOT_FOUND"
  | "PROFILE_NOT_FOUND"
  | "UNPARSABLE_SCORE"
  | "DISABLED"
  | "UNSUPPORTED"
  | "ERROR"
> {
  if (!LEADERBOARD_ENABLED) return "DISABLED";
  try {
    const result = await submitGameCenterLeaderBoardScore({
      score: clearTimeToLeaderboardScore(seconds),
    });
    if (!result) return "UNSUPPORTED";
    return result.statusCode;
  } catch {
    return "ERROR";
  }
}

export async function openLeaderboard(): Promise<boolean> {
  if (!LEADERBOARD_ENABLED) return false;
  try {
    const supported = isMinVersionSupported(GAME_CENTER_MIN_VERSION);
    if (!supported) return false;
    await openGameCenterLeaderboard();
    return true;
  } catch {
    return false;
  }
}
