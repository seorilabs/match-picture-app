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

/**
 * 전면 광고 빈도 캡은 "앱 세션" 단위 계약이다.
 * 게임 화면이 마운트/언마운트를 반복해도 상태가 유지되도록 모듈 스코프에 보관한다.
 * (영속 저장은 하지 않는다. 앱 프로세스를 다시 띄우면 초기화되는 것이 맞다.)
 */
let sessionState: InterstitialAdPolicyState = createInterstitialAdPolicyState();

export function getInterstitialAdPolicyState(): InterstitialAdPolicyState {
  return sessionState;
}

export function setInterstitialAdPolicyState(
  state: InterstitialAdPolicyState,
): void {
  sessionState = state;
}

/** 테스트 전용: 세션 상태를 초기화한다. */
export function resetInterstitialAdPolicyState(): void {
  sessionState = createInterstitialAdPolicyState();
}
