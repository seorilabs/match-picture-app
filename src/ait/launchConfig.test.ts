import { describe, expect, it } from "vitest";

import { parseCachedLaunchConfig, parseLaunchConfig } from "./launchConfig";

describe("parseLaunchConfig", () => {
  it("defaults operational switches to enabled", () => {
    expect(parseLaunchConfig({})).toMatchObject({
      leaderboardEnabled: true,
      reviewRequestEnabled: true,
      interstitialAdEnabled: true,
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

  it("parses cached config safely", () => {
    expect(
      parseCachedLaunchConfig('{"leaderboardEnabled":false}')
        ?.leaderboardEnabled,
    ).toBe(false);
    expect(parseCachedLaunchConfig("{bad-json")).toBeNull();
    expect(parseCachedLaunchConfig(null)).toBeNull();
  });
});
