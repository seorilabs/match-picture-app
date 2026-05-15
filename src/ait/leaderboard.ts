import {
  isMinVersionSupported,
  openGameCenterLeaderboard,
  submitGameCenterLeaderBoardScore,
} from "@apps-in-toss/web-framework";

import { MAX_DISPLAY_SECONDS } from "../game/rules";

const GAME_CENTER_MIN_VERSION = {
  android: "5.221.0",
  ios: "5.221.0",
} as const;

const SCORE_BASE = MAX_DISPLAY_SECONDS + 1;

export type OpenLeaderboardResult =
  | { status: "OPENED" }
  | { status: "UNSUPPORTED"; message: string }
  | { status: "ERROR"; message: string };

interface ReactNativeWebViewWindow extends Window {
  ReactNativeWebView?: {
    postMessage: (message: string) => void;
  };
}

function formatScore(score: number): string {
  return score.toFixed(3).replace(/\.?0+$/, "");
}

function stringifyError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function truncateMessage(message: string): string {
  return message.length > 140 ? `${message.slice(0, 137)}...` : message;
}

function postDebugLog(
  logType: "debug" | "warn" | "error",
  action: string,
  params: Record<string, string>,
) {
  const payload = {
    log_name: "match_picture_leaderboard",
    log_type: logType,
    params: {
      action,
      href: typeof window === "undefined" ? "" : window.location.href,
      ...params,
    },
  };

  try {
    const webView = (window as ReactNativeWebViewWindow).ReactNativeWebView;
    webView?.postMessage(
      JSON.stringify({
        type: "method",
        functionName: "debugLog",
        eventId: `match-picture-leaderboard-${Date.now()}`,
        args: [payload],
      }),
    );
  } catch {
    // Fall through to browser console in local development.
  }
}

function warnLeaderboard(message: string, error?: unknown) {
  const errorMessage =
    error === undefined ? undefined : truncateMessage(stringifyError(error));
  postDebugLog(error === undefined ? "warn" : "error", "warning", {
    message,
    ...(errorMessage ? { error: errorMessage } : {}),
  });

  if (!import.meta.env.DEV) return;
  if (error === undefined) {
    console.warn(`[leaderboard] ${message}`);
  } else {
    console.warn(`[leaderboard] ${message}`, error);
  }
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
  try {
    const result = await submitGameCenterLeaderBoardScore({
      score: clearTimeToLeaderboardScore(seconds),
    });
    if (!result) {
      warnLeaderboard("score submit skipped: unsupported app version");
      return "UNSUPPORTED";
    }
    if (result.statusCode !== "SUCCESS") {
      warnLeaderboard(`score submit failed: ${result.statusCode}`);
    }
    return result.statusCode;
  } catch (error) {
    warnLeaderboard("score submit threw", error);
    return "ERROR";
  }
}

export async function openLeaderboard(): Promise<OpenLeaderboardResult> {
  postDebugLog("debug", "open_requested", {});

  try {
    const supported = isMinVersionSupported(GAME_CENTER_MIN_VERSION);
    if (!supported) {
      const message = "unsupported app version";
      warnLeaderboard(`open skipped: ${message}`);
      return { status: "UNSUPPORTED", message };
    }
    await openGameCenterLeaderboard();
    postDebugLog("debug", "open_resolved", { status: "OPENED" });
    return { status: "OPENED" };
  } catch (error) {
    const message = truncateMessage(stringifyError(error));
    warnLeaderboard("open threw", error);
    return { status: "ERROR", message };
  }
}
