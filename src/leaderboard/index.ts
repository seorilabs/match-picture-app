import { Capacitor } from "@capacitor/core";

import {
  clearTimeToLeaderboardScore,
  openLeaderboard as openTossLeaderboard,
  submitClearTime as submitTossClearTime,
  type OpenLeaderboardResult,
} from "../ait/leaderboard";
import { NATIVE_LEADERBOARD } from "./config";
import { GameServices } from "./gameServices";
import { getLeaderboardPlatform } from "./platform";
import { clearTimeToNativeScore, type NativeLeaderboardPlatform } from "./score";

export type SubmitScoreStatus =
  | "SUCCESS"
  | "LEADERBOARD_NOT_FOUND"
  | "PROFILE_NOT_FOUND"
  | "UNPARSABLE_SCORE"
  | "DISABLED"
  | "UNSUPPORTED"
  | "ERROR";

export type { OpenLeaderboardResult };
export { clearTimeToLeaderboardScore };

function nativePlatform(): NativeLeaderboardPlatform | null {
  const platform = Capacitor.getPlatform();
  if (platform === "android" || platform === "ios") return platform;
  return null;
}

async function submitNativeClearTime(
  seconds: number,
): Promise<SubmitScoreStatus> {
  const platform = nativePlatform();
  if (!platform) return "UNSUPPORTED";

  const leaderboardId = NATIVE_LEADERBOARD[platform];
  // 콘솔에서 리더보드 ID를 채우기 전(fast-follow)에는 조용히 비활성.
  if (!leaderboardId) return "DISABLED";

  try {
    const { authenticated } = await GameServices.signIn();
    // 로그인 안 되면(미인증/테스터 아님) 제출을 시도하지 않는다.
    if (!authenticated) return "ERROR";
    await GameServices.submitScore({
      leaderboardId,
      score: clearTimeToNativeScore(seconds, platform),
    });
    return "SUCCESS";
  } catch {
    return "ERROR";
  }
}

async function openNativeLeaderboard(): Promise<OpenLeaderboardResult> {
  const platform = nativePlatform();
  if (!platform) return { status: "UNSUPPORTED", message: "unsupported platform" };

  const leaderboardId = NATIVE_LEADERBOARD[platform];
  if (!leaderboardId) {
    return { status: "UNSUPPORTED", message: "leaderboard not configured" };
  }

  try {
    const { authenticated } = await GameServices.signIn();
    // 로그인 실패 시 getLeaderboardIntent가 SIGN_IN_REQUIRED로 떨어지므로
    // 시도하지 않고 명확한 메시지를 돌려준다.
    if (!authenticated) {
      return { status: "ERROR", message: "sign-in required" };
    }
    await GameServices.showLeaderboard({ leaderboardId });
    return { status: "OPENED" };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { status: "ERROR", message };
  }
}

/**
 * 실행 환경에 맞는 리더보드 백엔드로 클리어 기록을 제출한다.
 * (Capacitor 네이티브 → Play Games/Game Center, Toss → 게임센터 브리지, 그 외 → no-op)
 */
export async function submitClearTime(
  seconds: number,
): Promise<SubmitScoreStatus> {
  switch (getLeaderboardPlatform()) {
    case "capacitor-native":
      return submitNativeClearTime(seconds);
    case "toss":
      return submitTossClearTime(seconds);
    case "web":
      return "UNSUPPORTED";
  }
}

/** 실행 환경에 맞는 네이티브 리더보드 UI를 연다. */
export async function openLeaderboard(): Promise<OpenLeaderboardResult> {
  switch (getLeaderboardPlatform()) {
    case "capacitor-native":
      return openNativeLeaderboard();
    case "toss":
      return openTossLeaderboard();
    case "web":
      return { status: "UNSUPPORTED", message: "unsupported environment" };
  }
}
