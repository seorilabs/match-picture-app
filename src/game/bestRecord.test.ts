import { describe, expect, it } from "vitest";

import { bestRecordKey, isNewBest, parseBestSeconds } from "./bestRecord";

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
