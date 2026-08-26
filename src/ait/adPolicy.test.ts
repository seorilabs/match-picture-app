import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  canShowInterstitialAd,
  createInterstitialAdPolicyState,
  getInterstitialAdPolicyState,
  recordCompletedGame,
  recordInterstitialShown,
  resetInterstitialAdPolicyState,
  setInterstitialAdPolicyState,
  showInterstitialAdIfAllowed,
} from "./adPolicy";

const DEFAULT_POLICY = {
  minIntervalSeconds: 120,
  freeGames: 2,
};

describe("interstitial ad policy", () => {
  it("exempts the first configured number of completed games", () => {
    let state = createInterstitialAdPolicyState();

    state = recordCompletedGame(state);
    expect(canShowInterstitialAd(state, DEFAULT_POLICY, 0)).toBe(false);

    state = recordCompletedGame(state);
    expect(canShowInterstitialAd(state, DEFAULT_POLICY, 0)).toBe(false);

    state = recordCompletedGame(state);
    expect(canShowInterstitialAd(state, DEFAULT_POLICY, 0)).toBe(true);
  });

  it("enforces the minimum interval after a successful impression", () => {
    let state = createInterstitialAdPolicyState();
    state = recordCompletedGame(state);
    state = recordCompletedGame(state);
    state = recordCompletedGame(state);
    state = recordInterstitialShown(state, 10_000);

    expect(canShowInterstitialAd(state, DEFAULT_POLICY, 129_999)).toBe(false);
    expect(canShowInterstitialAd(state, DEFAULT_POLICY, 130_000)).toBe(true);
  });

  it("does not change policy state when an impression is skipped", () => {
    let state = createInterstitialAdPolicyState();
    state = recordCompletedGame(state);
    state = recordCompletedGame(state);
    state = recordCompletedGame(state);

    expect(canShowInterstitialAd(state, DEFAULT_POLICY, 50_000)).toBe(true);
    expect(state).toEqual({
      completedGames: 3,
      lastShownAtMs: null,
    });
  });

  it("keeps the preloaded ad untouched when the cap blocks exposure", async () => {
    let state = createInterstitialAdPolicyState();
    state = recordCompletedGame(state);
    const show = vi.fn(async () => true);

    const next = await showInterstitialAdIfAllowed({
      ready: true,
      state,
      config: DEFAULT_POLICY,
      show,
      clock: () => 50_000,
    });

    expect(show).not.toHaveBeenCalled();
    expect(next).toBe(state);
  });

  it("does not call the ad API when the kill-switch makes it unavailable", async () => {
    let state = createInterstitialAdPolicyState();
    state = recordCompletedGame(state);
    state = recordCompletedGame(state);
    state = recordCompletedGame(state);
    const show = vi.fn(async () => true);

    const next = await showInterstitialAdIfAllowed({
      ready: false,
      state,
      config: DEFAULT_POLICY,
      show,
      clock: () => 50_000,
    });

    expect(show).not.toHaveBeenCalled();
    expect(next).toBe(state);
  });

  it("records only a successful exposure", async () => {
    let state = createInterstitialAdPolicyState();
    state = recordCompletedGame(state);
    state = recordCompletedGame(state);
    state = recordCompletedGame(state);

    const failed = await showInterstitialAdIfAllowed({
      ready: true,
      state,
      config: DEFAULT_POLICY,
      show: vi.fn(async () => false),
      clock: () => 50_000,
    });
    expect(failed).toBe(state);

    const shown = await showInterstitialAdIfAllowed({
      ready: true,
      state,
      config: DEFAULT_POLICY,
      show: vi.fn(async () => true),
      clock: () => 60_000,
    });
    expect(shown).toEqual({
      completedGames: 3,
      lastShownAtMs: 60_000,
    });
  });
});

describe("세션 단위 정책 상태", () => {
  beforeEach(() => {
    resetInterstitialAdPolicyState();
  });

  it("화면이 언마운트/재마운트돼도 상태가 유지된다", () => {
    // GameScreen 마운트 1: 1판 완료
    setInterstitialAdPolicyState(
      recordCompletedGame(getInterstitialAdPolicyState()),
    );
    // 홈 복귀(언마운트) 후 다시 진입해도 모듈 상태는 그대로다.
    expect(getInterstitialAdPolicyState().completedGames).toBe(1);
    setInterstitialAdPolicyState(
      recordCompletedGame(getInterstitialAdPolicyState()),
    );
    setInterstitialAdPolicyState(
      recordCompletedGame(getInterstitialAdPolicyState()),
    );
    expect(getInterstitialAdPolicyState().completedGames).toBe(3);
  });

  it("홈을 경유해 누적 3판이면 면제(2판)를 넘겨 광고를 노출한다", async () => {
    const config = { minIntervalSeconds: 120, freeGames: 2 };
    let shown = 0;
    const show = async () => {
      shown += 1;
      return true;
    };

    for (let game = 0; game < 3; game++) {
      setInterstitialAdPolicyState(
        recordCompletedGame(getInterstitialAdPolicyState()),
      );
    }
    setInterstitialAdPolicyState(
      await showInterstitialAdIfAllowed({
        ready: true,
        state: getInterstitialAdPolicyState(),
        config,
        show,
        clock: () => 1_000_000,
      }),
    );
    expect(shown).toBe(1);

    // 마지막 실제 노출 시각이 유지되어 최소 간격이 화면 왕복과 무관하게 적용된다.
    setInterstitialAdPolicyState(
      recordCompletedGame(getInterstitialAdPolicyState()),
    );
    setInterstitialAdPolicyState(
      await showInterstitialAdIfAllowed({
        ready: true,
        state: getInterstitialAdPolicyState(),
        config,
        show,
        clock: () => 1_000_000 + 60_000,
      }),
    );
    expect(shown).toBe(1);
  });

  it("리셋하면 앱 프로세스 재시작처럼 초기화된다", () => {
    setInterstitialAdPolicyState(
      recordCompletedGame(getInterstitialAdPolicyState()),
    );
    resetInterstitialAdPolicyState();
    expect(getInterstitialAdPolicyState()).toEqual({
      completedGames: 0,
      lastShownAtMs: null,
    });
  });
});
