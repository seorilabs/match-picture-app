export interface InterstitialAdPolicyConfig {
  minIntervalSeconds: number;
  freeGames: number;
}

export interface InterstitialAdPolicyState {
  completedGames: number;
  lastShownAtMs: number | null;
}

export function createInterstitialAdPolicyState(): InterstitialAdPolicyState {
  return {
    completedGames: 0,
    lastShownAtMs: null,
  };
}

export function recordCompletedGame(
  state: InterstitialAdPolicyState,
): InterstitialAdPolicyState {
  return {
    ...state,
    completedGames: state.completedGames + 1,
  };
}

export function recordInterstitialShown(
  state: InterstitialAdPolicyState,
  shownAtMs: number,
): InterstitialAdPolicyState {
  return {
    ...state,
    lastShownAtMs: shownAtMs,
  };
}

export function canShowInterstitialAd(
  state: InterstitialAdPolicyState,
  config: InterstitialAdPolicyConfig,
  nowMs: number,
): boolean {
  if (state.completedGames <= config.freeGames) return false;
  if (state.lastShownAtMs === null) return true;

  const minimumIntervalMs = config.minIntervalSeconds * 1000;
  return nowMs - state.lastShownAtMs >= minimumIntervalMs;
}

interface ShowInterstitialAdIfAllowedOptions {
  ready: boolean;
  state: InterstitialAdPolicyState;
  config: InterstitialAdPolicyConfig;
  show: () => Promise<boolean>;
  clock?: () => number;
}

export async function showInterstitialAdIfAllowed({
  ready,
  state,
  config,
  show,
  clock = Date.now,
}: ShowInterstitialAdIfAllowedOptions): Promise<InterstitialAdPolicyState> {
  if (!ready || !canShowInterstitialAd(state, config, clock())) {
    return state;
  }

  const shown = await show();
  return shown ? recordInterstitialShown(state, clock()) : state;
}
