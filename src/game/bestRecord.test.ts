import { describe, expect, it } from "vitest";

import {
  NEAR_MISS_THRESHOLD_SECONDS,
  bestGapSeconds,
  bestRecordKey,
  dailyBestKey,
  dailyLateClearKey,
  dailySubmittedKey,
  isNearMiss,
  isNewBest,
  parseBestSeconds,
} from "./bestRecord";

describe("bestRecordKey", () => {
  it("클래식은 고정 키, 데일리는 날짜별 키를 쓴다", () => {
    expect(bestRecordKey("classic", "2026-06-10")).toBe(
      "match-picture/best-seconds",
    );
    expect(bestRecordKey("daily", "2026-06-10")).toBe(
      "match-picture/daily-best/2026-06-10",
    );
  });

  it("도전장 모드는 기록을 남기지 않는다", () => {
    expect(bestRecordKey("challenge", "2026-06-10")).toBeNull();
  });
});

describe("parseBestSeconds", () => {
  it("정상 기록을 파싱한다", () => {
    expect(parseBestSeconds("32.41")).toBe(32.41);
  });

  it("없거나 손상된 값은 null", () => {
    expect(parseBestSeconds(null)).toBeNull();
    expect(parseBestSeconds("abc")).toBeNull();
    expect(parseBestSeconds("-3")).toBeNull();
    expect(parseBestSeconds("0")).toBeNull();
  });
});

describe("isNewBest", () => {
  it("기존 기록이 없으면 신기록이다", () => {
    expect(isNewBest(30, null)).toBe(true);
  });

  it("더 빠를 때만 신기록이다", () => {
    expect(isNewBest(29.9, 30)).toBe(true);
    expect(isNewBest(30, 30)).toBe(false);
    expect(isNewBest(31, 30)).toBe(false);
  });

  it("비정상 결과는 신기록이 아니다", () => {
    expect(isNewBest(0, null)).toBe(false);
    expect(isNewBest(Number.NaN, null)).toBe(false);
  });
});

describe("bestGapSeconds", () => {
  it("베스트에 못 미친 만큼의 차이를 돌려준다", () => {
    expect(bestGapSeconds(30.8, 30)).toBeCloseTo(0.8);
  });

  it("신기록이거나 베스트가 없으면 null", () => {
    expect(bestGapSeconds(29, 30)).toBeNull();
    expect(bestGapSeconds(30, 30)).toBeNull();
    expect(bestGapSeconds(30, null)).toBeNull();
  });

  it("비정상 결과는 null", () => {
    expect(bestGapSeconds(Number.NaN, 30)).toBeNull();
    expect(bestGapSeconds(0, 30)).toBeNull();
  });
});

describe("isNearMiss", () => {
  it("임계값 이하로 못 미치면 near-miss다", () => {
    expect(isNearMiss(30 + NEAR_MISS_THRESHOLD_SECONDS, 30)).toBe(true);
    expect(isNearMiss(30.1, 30)).toBe(true);
  });

  it("부동소수점 오차가 있는 경계값도 near-miss로 판정한다", () => {
    // 32.7 - 30.2 === 2.5000000000000036 (정확히 2.5초 차이를 의도한 값)
    expect(32.7 - 30.2).toBeGreaterThan(NEAR_MISS_THRESHOLD_SECONDS);
    expect(isNearMiss(32.7, 30.2)).toBe(true);
  });

  it("크게 뒤지거나 신기록이면 near-miss가 아니다", () => {
    expect(isNearMiss(30 + NEAR_MISS_THRESHOLD_SECONDS + 0.1, 30)).toBe(false);
    expect(isNearMiss(29, 30)).toBe(false);
    expect(isNearMiss(30, null)).toBe(false);
  });
});

describe("데일리 제출/사후 클리어 키", () => {
  it("날짜별로 분리된 키를 만든다", () => {
    expect(dailySubmittedKey("2026-08-26")).toBe(
      "match-picture/daily-submitted/2026-08-26",
    );
    expect(dailySubmittedKey("2026-08-26")).not.toBe(
      dailySubmittedKey("2026-08-27"),
    );
    expect(dailyLateClearKey("2026-08-26")).toBe(
      "match-picture/daily-late/2026-08-26",
    );
  });

  it("베스트 키와 겹치지 않는다", () => {
    expect(dailySubmittedKey("2026-08-26")).not.toBe(dailyBestKey("2026-08-26"));
    expect(dailyLateClearKey("2026-08-26")).not.toBe(dailyBestKey("2026-08-26"));
  });

  it("스테이지 모드는 시간 기록을 남기지 않는다", () => {
    expect(bestRecordKey("stage", "2026-08-26")).toBeNull();
  });
});
