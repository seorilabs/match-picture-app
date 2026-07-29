import { describe, expect, it, vi } from "vitest";

import {
  canShowInterstitialAd,
  createInterstitialAdPolicyState,
  recordCompletedGame,
  recordInterstitialShown,
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
