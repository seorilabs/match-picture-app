import { readRemoteFlags, refreshRemoteFlags } from "../firebase/remoteConfig";

export interface LaunchConfig {
  leaderboardEnabled: boolean;
  reviewRequestEnabled: boolean;
  interstitialAdEnabled: boolean;
  interstitialMinIntervalSeconds: number;
  interstitialFreeGames: number;
}

/**
 * 운영 페이로드를 LaunchConfig로 정규화한다.
 * Firebase RC가 돌려주는 평탄한 객체뿐 아니라, 과거/유연한 중첩 형태도 받아들인다.
 */
type RemoteConfigPayload =
  | {
      leaderboardEnabled?: unknown;
      reviewRequestEnabled?: unknown;
      interstitialAdEnabled?: unknown;
      interstitialMinIntervalSeconds?: unknown;
      interstitialFreeGames?: unknown;
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
        interstitialMinIntervalSeconds?: unknown;
        interstitialFreeGames?: unknown;
      };
      interstitialAd?: {
        enabled?: unknown;
        minIntervalSeconds?: unknown;
        freeGames?: unknown;
      };
    }
  | null
  | undefined;

const DEFAULT_LAUNCH_CONFIG: LaunchConfig = {
  leaderboardEnabled: true,
  reviewRequestEnabled: true,
  interstitialAdEnabled: true,
  interstitialMinIntervalSeconds: 120,
  interstitialFreeGames: 2,
};

function readBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function readNonNegativeInteger(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return null;
  }
  return Math.floor(value);
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

  const interstitialMinIntervalSeconds =
    readNonNegativeInteger(payload?.interstitialMinIntervalSeconds) ??
    readNonNegativeInteger(payload?.ads?.interstitialMinIntervalSeconds) ??
    readNonNegativeInteger(payload?.interstitialAd?.minIntervalSeconds) ??
    DEFAULT_LAUNCH_CONFIG.interstitialMinIntervalSeconds;

  const interstitialFreeGames =
    readNonNegativeInteger(payload?.interstitialFreeGames) ??
    readNonNegativeInteger(payload?.ads?.interstitialFreeGames) ??
    readNonNegativeInteger(payload?.interstitialAd?.freeGames) ??
    DEFAULT_LAUNCH_CONFIG.interstitialFreeGames;

  return {
    leaderboardEnabled,
    reviewRequestEnabled,
    interstitialAdEnabled,
    interstitialMinIntervalSeconds,
    interstitialFreeGames,
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
