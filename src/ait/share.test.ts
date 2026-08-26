import { describe, expect, it } from "vitest";

import {
  ROUND_CLEAN_EMOJI,
  ROUND_MISS_EMOJI,
  buildChallengeQuery,
  buildDailyShareMessage,
  buildRoundGrid,
} from "./share";
import { setLocale } from "../i18n/i18n";

describe("buildRoundGrid", () => {
  it("라운드별 정오답을 스포일러 없는 이모지로 만든다", () => {
    expect(buildRoundGrid([true, false, true])).toBe(
      `${ROUND_CLEAN_EMOJI}${ROUND_MISS_EMOJI}${ROUND_CLEAN_EMOJI}`,
    );
    expect(buildRoundGrid([])).toBe("");
  });
});

describe("buildDailyShareMessage", () => {
  it("날짜·기록·그리드·링크를 담고 라운드 수가 일치한다", () => {
    setLocale("ko");
    const roundResults = [true, true, false, true, true];
    const message = buildDailyShareMessage({
      dateString: "2026-08-26",
      seconds: 23.4,
      roundResults,
      link: "https://example.test/app",
    });

    expect(message).toContain("8/26");
    expect(message).toContain("23s");
    expect(message).toContain(buildRoundGrid(roundResults));
    expect(message).toContain("https://example.test/app");

    const gridLine = message
      .split("\n")
      .find((line) => line.includes(ROUND_CLEAN_EMOJI)) as string;
    expect([...gridLine]).toHaveLength(roundResults.length);
  });

  it("영어 로케일에서도 같은 구조를 유지한다", () => {
    setLocale("en");
    const message = buildDailyShareMessage({
      dateString: "2026-08-26",
      seconds: 10,
      roundResults: [true],
      link: "L",
    });
    expect(message.split("\n")).toHaveLength(4);
    setLocale("ko");
  });
});

describe("buildChallengeQuery", () => {
  it("시드와 목표 기록을 쿼리로 만든다", () => {
    expect(buildChallengeQuery({ seed: 42, seconds: 12.345 })).toBe(
      "challengeSeed=42&challengeTarget=12.35",
    );
  });
});
