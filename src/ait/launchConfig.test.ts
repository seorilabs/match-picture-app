import { describe, expect, it } from "vitest";

import { parseLaunchConfig } from "./launchConfig";

describe("parseLaunchConfig", () => {
  it("defaults operational switches to enabled", () => {
    expect(parseLaunchConfig({})).toMatchObject({
      leaderboardEnabled: true,
      reviewRequestEnabled: true,
      interstitialAdEnabled: true,
      interstitialMinIntervalSeconds: 120,
      interstitialFreeGames: 2,
    });
  });

  it("reads top-level leaderboardEnabled", () => {
    expect(
      parseLaunchConfig({ leaderboardEnabled: false }).leaderboardEnabled,
    ).toBe(false);
  });

  it("reads nested feature flag variants", () => {
    expect(
      parseLaunchConfig({ features: { leaderboard: false } })
        .leaderboardEnabled,
    ).toBe(false);
    expect(
      parseLaunchConfig({ leaderboard: { enabled: false } })
        .leaderboardEnabled,
    ).toBe(false);
  });

  it("reads review and interstitial kill switches", () => {
    expect(
      parseLaunchConfig({
        reviewRequestEnabled: false,
        interstitialAdEnabled: false,
      }),
    ).toMatchObject({
      reviewRequestEnabled: false,
      interstitialAdEnabled: false,
    });
    expect(
      parseLaunchConfig({
        review: { enabled: false },
        ads: { interstitialEnabled: false },
      }),
    ).toMatchObject({
      reviewRequestEnabled: false,
      interstitialAdEnabled: false,
    });
  });

  it("normalizes interstitial frequency cap values", () => {
    expect(
      parseLaunchConfig({
        interstitialMinIntervalSeconds: 90.9,
        interstitialFreeGames: 3.8,
      }),
    ).toMatchObject({
      interstitialMinIntervalSeconds: 90,
      interstitialFreeGames: 3,
    });

    expect(
      parseLaunchConfig({
        interstitialMinIntervalSeconds: -1,
        interstitialFreeGames: Number.NaN,
      }),
    ).toMatchObject({
      interstitialMinIntervalSeconds: 120,
      interstitialFreeGames: 2,
    });
  });

  it("reads nested interstitial frequency cap variants", () => {
    expect(
      parseLaunchConfig({
        interstitialAd: {
          minIntervalSeconds: 60,
          freeGames: 1,
        },
      }),
    ).toMatchObject({
      interstitialMinIntervalSeconds: 60,
      interstitialFreeGames: 1,
    });
  });
});
