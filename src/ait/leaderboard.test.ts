import { describe, expect, it } from "vitest";

import { clearTimeToLeaderboardScore } from "./leaderboard";

describe("clearTimeToLeaderboardScore", () => {
  it("짧은 클리어 시간일수록 큰 점수로 변환한다", () => {
    const faster = Number(clearTimeToLeaderboardScore(18.42));
    const slower = Number(clearTimeToLeaderboardScore(25.1));

    expect(faster).toBeGreaterThan(slower);
  });

  it("1000점 기준에서 클리어 시간을 뺀 값을 제출한다", () => {
    expect(clearTimeToLeaderboardScore(18.42)).toBe("981.58");
    expect(clearTimeToLeaderboardScore(25)).toBe("975");
  });

  it("음수나 비정상 값은 0초 기록처럼 처리한다", () => {
    expect(clearTimeToLeaderboardScore(-1)).toBe("1000");
    expect(clearTimeToLeaderboardScore(Number.NaN)).toBe("1000");
  });
});
