import { readItem, writeItem } from "./storage";

export interface LaunchConfig {
  leaderboardEnabled: boolean;
  reviewRequestEnabled: boolean;
  interstitialAdEnabled: boolean;
}

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

const CACHE_KEY = "match-picture/launch-config";

function splitUrls(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);
}

const REMOTE_CONFIG_URLS = [
  ...splitUrls(import.meta.env.VITE_REMOTE_CONFIG_URL),
  ...splitUrls(import.meta.env.VITE_REMOTE_CONFIG_FALLBACK_URL),
];

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

export function parseCachedLaunchConfig(value: string | null): LaunchConfig | null {
  if (!value) return null;
  try {
    return parseLaunchConfig(JSON.parse(value) as RemoteConfigPayload);
  } catch {
    return null;
  }
}

export function getDefaultLaunchConfig(): LaunchConfig {
  return DEFAULT_LAUNCH_CONFIG;
}

export async function loadCachedLaunchConfig(): Promise<LaunchConfig | null> {
  return parseCachedLaunchConfig(await readItem(CACHE_KEY));
}

async function fetchLaunchConfig(url: string): Promise<LaunchConfig | null> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 1600);

  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) return null;

    const payload = (await response.json()) as RemoteConfigPayload;
    return parseLaunchConfig(payload);
  } catch {
    return null;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function loadLaunchConfig(): Promise<LaunchConfig> {
  for (const url of REMOTE_CONFIG_URLS) {
    const config = await fetchLaunchConfig(url);
    if (config !== null) {
      void writeItem(CACHE_KEY, JSON.stringify(config));
      return config;
    }
  }

  return (await loadCachedLaunchConfig()) ?? DEFAULT_LAUNCH_CONFIG;
}
