import { describe, expect, it } from "vitest";

import { clearTimeToNativeScore } from "./score";

describe("clearTimeToNativeScore", () => {
  it("converts seconds to milliseconds on Android", () => {
    expect(clearTimeToNativeScore(18.42, "android")).toBe(18420);
    expect(clearTimeToNativeScore(25, "android")).toBe(25000);
  });

  it("converts seconds to centiseconds on iOS", () => {
    expect(clearTimeToNativeScore(18.42, "ios")).toBe(1842);
    expect(clearTimeToNativeScore(25, "ios")).toBe(2500);
  });

  it("keeps faster clears as smaller scores (low-to-high ordering)", () => {
    const faster = clearTimeToNativeScore(18.42, "android");
    const slower = clearTimeToNativeScore(25.1, "android");
    expect(faster).toBeLessThan(slower);
  });

  it("clamps invalid input to zero", () => {
    expect(clearTimeToNativeScore(-1, "android")).toBe(0);
    expect(clearTimeToNativeScore(Number.NaN, "ios")).toBe(0);
  });
});
