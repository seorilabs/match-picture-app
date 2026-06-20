import { readRemoteFlags, refreshRemoteFlags } from "../firebase/remoteConfig";

export interface LaunchConfig {
  leaderboardEnabled: boolean;
  reviewRequestEnabled: boolean;
  interstitialAdEnabled: boolean;
}

/**
 * 불리언 kill-switch 페이로드를 LaunchConfig로 정규화한다.
 * Firebase RC가 돌려주는 평탄한 불리언 객체뿐 아니라, 과거/유연한 중첩 형태도 받아들인다.
 */
type RemoteConfigPayload =
  | {
      leaderboardEnabled?: unknown;
      reviewRequestEnabled?: unknown;
      interstitialAdEnabled?: unknown;
      features?: {
        leaderboard?: unknown;
        reviewRequest?: unknown;
        interstitialAd?: unknown;
      };
      leaderboard?: {
        enabled?: unknown;
      };
      review?: {
        enabled?: unknown;
        requestEnabled?: unknown;
      };
      ads?: {
        enabled?: unknown;
        interstitialEnabled?: unknown;
      };
      interstitialAd?: {
        enabled?: unknown;
      };
    }
  | null
  | undefined;

const DEFAULT_LAUNCH_CONFIG: LaunchConfig = {
  leaderboardEnabled: true,
  reviewRequestEnabled: true,
  interstitialAdEnabled: true,
};

function readBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

export function parseLaunchConfig(payload: RemoteConfigPayload): LaunchConfig {
  const leaderboardEnabled =
    readBoolean(payload?.leaderboardEnabled) ??
    readBoolean(payload?.features?.leaderboard) ??
    readBoolean(payload?.leaderboard?.enabled) ??
    DEFAULT_LAUNCH_CONFIG.leaderboardEnabled;

  const reviewRequestEnabled =
    readBoolean(payload?.reviewRequestEnabled) ??
    readBoolean(payload?.features?.reviewRequest) ??
    readBoolean(payload?.review?.requestEnabled) ??
    readBoolean(payload?.review?.enabled) ??
    DEFAULT_LAUNCH_CONFIG.reviewRequestEnabled;

  const interstitialAdEnabled =
    readBoolean(payload?.interstitialAdEnabled) ??
    readBoolean(payload?.features?.interstitialAd) ??
    readBoolean(payload?.ads?.interstitialEnabled) ??
    readBoolean(payload?.ads?.enabled) ??
    readBoolean(payload?.interstitialAd?.enabled) ??
    DEFAULT_LAUNCH_CONFIG.interstitialAdEnabled;

  return {
    leaderboardEnabled,
    reviewRequestEnabled,
    interstitialAdEnabled,
  };
}

export function getDefaultLaunchConfig(): LaunchConfig {
  return DEFAULT_LAUNCH_CONFIG;
}

/** Firebase RC의 마지막 활성값(또는 기본값)을 즉시 읽는다. */
export async function loadCachedLaunchConfig(): Promise<LaunchConfig | null> {
  const flags = await readRemoteFlags(DEFAULT_LAUNCH_CONFIG);
  return flags ? parseLaunchConfig(flags) : null;
}

/** Firebase RC에서 최신값을 받아온다. 실패 시 기본값. */
export async function loadLaunchConfig(): Promise<LaunchConfig> {
  const flags = await refreshRemoteFlags(DEFAULT_LAUNCH_CONFIG);
  return flags ? parseLaunchConfig(flags) : DEFAULT_LAUNCH_CONFIG;
}
