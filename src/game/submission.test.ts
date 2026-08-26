import { describe, expect, it } from "vitest";

import {
  canUpdateBestRecord,
  decideSubmission,
  type ClearSubmissionContext,
} from "./submission";

function context(
  overrides: Partial<ClearSubmissionContext> = {},
): ClearSubmissionContext {
  return {
    mode: "classic",
    leaderboardEnabled: true,
    powerUpUseCount: 0,
    dailyAlreadySubmitted: false,
    archivedDaily: false,
    ...overrides,
  };
}

describe("decideSubmission", () => {
  it("보조 없는 클래식 클리어는 제출한다", () => {
    expect(decideSubmission(context())).toEqual({ submit: true, reason: null });
  });

  it("리더보드가 꺼져 있으면 제출하지 않는다", () => {
    expect(decideSubmission(context({ leaderboardEnabled: false }))).toEqual({
      submit: false,
      reason: "disabled",
    });
  });

  it("도전장과 스테이지는 제출하지 않는다", () => {
    expect(decideSubmission(context({ mode: "challenge" })).reason).toBe(
      "unranked-mode",
    );
    expect(decideSubmission(context({ mode: "stage" })).reason).toBe(
      "unranked-mode",
    );
  });

  it("파워업을 쓴 클래식 런은 제출하지 않는다", () => {
    expect(decideSubmission(context({ powerUpUseCount: 1 })).reason).toBe(
      "power-up-used",
    );
  });

  it("데일리 첫 클리어만 제출하고 재도전은 막는다", () => {
    expect(decideSubmission(context({ mode: "daily" })).submit).toBe(true);
    expect(
      decideSubmission(context({ mode: "daily", dailyAlreadySubmitted: true })),
    ).toEqual({ submit: false, reason: "daily-retry" });
  });

  it("지난 날짜 아카이브 데일리는 제출하지 않는다", () => {
    expect(
      decideSubmission(context({ mode: "daily", archivedDaily: true })).reason,
    ).toBe("archived-daily");
  });
});

describe("canUpdateBestRecord", () => {
  it("파워업을 쓴 클래식 런은 개인 베스트도 갱신하지 않는다", () => {
    expect(canUpdateBestRecord("classic", 0)).toBe(true);
    expect(canUpdateBestRecord("classic", 1)).toBe(false);
  });

  it("데일리는 갱신하고 도전장·스테이지는 기록을 남기지 않는다", () => {
    expect(canUpdateBestRecord("daily", 0)).toBe(true);
    expect(canUpdateBestRecord("challenge", 0)).toBe(false);
    expect(canUpdateBestRecord("stage", 0)).toBe(false);
  });
});
