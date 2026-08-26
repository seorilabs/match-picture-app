import { describe, expect, it } from "vitest";

import {
  formatCountdown,
  formatDailyLabel,
  getDailySeed,
  getKstDateString,
  msUntilNextDaily,
  parseChallengeParams,
  recentDailyDates,
} from "./mode";
import { MAX_SEED } from "./rng";

describe("getKstDateString", () => {
  it("UTC 자정 이전이라도 KST 기준 날짜를 돌려준다", () => {
    // UTC 2026-06-09 16:00 = KST 2026-06-10 01:00
    expect(getKstDateString(new Date("2026-06-09T16:00:00Z"))).toBe(
      "2026-06-10",
    );
  });

  it("KST 자정 직전에는 전날 날짜를 유지한다", () => {
    // UTC 2026-06-09 14:59 = KST 2026-06-09 23:59
    expect(getKstDateString(new Date("2026-06-09T14:59:00Z"))).toBe(
      "2026-06-09",
    );
  });
});

describe("getDailySeed", () => {
  it("같은 날짜는 같은 시드, 다른 날짜는 다른 시드를 만든다", () => {
    expect(getDailySeed("2026-06-10")).toBe(getDailySeed("2026-06-10"));
    expect(getDailySeed("2026-06-10")).not.toBe(getDailySeed("2026-06-11"));
  });
});

describe("formatDailyLabel", () => {
  it("0 패딩을 제거한 월/일 표기를 만든다", () => {
    expect(formatDailyLabel("2026-06-10")).toBe("6/10");
    expect(formatDailyLabel("2026-12-03")).toBe("12/3");
  });
});

describe("parseChallengeParams", () => {
  it("유효한 시드를 파싱한다", () => {
    expect(parseChallengeParams("?challengeSeed=12345")).toEqual({
      seed: 12345,
      targetSeconds: null,
    });
  });

  it("목표 기록까지 함께 파싱한다", () => {
    expect(
      parseChallengeParams("?challengeSeed=42&challengeTarget=32.41"),
    ).toEqual({ seed: 42, targetSeconds: 32.41 });
  });

  it("시드가 없으면 null을 돌려준다", () => {
    expect(parseChallengeParams("")).toBeNull();
    expect(parseChallengeParams("?foo=bar")).toBeNull();
  });

  it("시드가 32비트 정수 범위를 벗어나면 도전장을 무시한다", () => {
    expect(parseChallengeParams("?challengeSeed=-1")).toBeNull();
    expect(parseChallengeParams(`?challengeSeed=${MAX_SEED + 1}`)).toBeNull();
    expect(parseChallengeParams("?challengeSeed=1.5")).toBeNull();
    expect(parseChallengeParams("?challengeSeed=abc")).toBeNull();
  });

  it("빈 값이나 10진 정수가 아닌 표기는 거부한다", () => {
    expect(parseChallengeParams("?challengeSeed=")).toBeNull();
    expect(parseChallengeParams("?challengeSeed=%20")).toBeNull();
    expect(parseChallengeParams("?challengeSeed=0x10")).toBeNull();
    expect(parseChallengeParams("?challengeSeed=1e3")).toBeNull();
    expect(parseChallengeParams("?challengeSeed=0")).toEqual({
      seed: 0,
      targetSeconds: null,
    });
  });

  it("목표 기록이 비정상이면 시드만 사용한다", () => {
    expect(
      parseChallengeParams("?challengeSeed=1&challengeTarget=-5"),
    ).toEqual({ seed: 1, targetSeconds: null });
    expect(
      parseChallengeParams("?challengeSeed=1&challengeTarget=abc"),
    ).toEqual({ seed: 1, targetSeconds: null });
    expect(
      parseChallengeParams("?challengeSeed=1&challengeTarget=100000"),
    ).toEqual({ seed: 1, targetSeconds: null });
  });
});

describe("msUntilNextDaily / formatCountdown", () => {
  it("KST 자정까지 남은 시간을 계산한다", () => {
    // 2026-08-26 15:00Z = KST 2026-08-27 00:00 → 남은 시간 24시간(경계 직후)
    expect(msUntilNextDaily(new Date("2026-08-26T15:00:00Z"))).toBe(
      24 * 60 * 60 * 1000,
    );
    // 자정 1초 전
    expect(msUntilNextDaily(new Date("2026-08-26T14:59:59Z"))).toBe(1000);
    // 자정 1초 후
    expect(msUntilNextDaily(new Date("2026-08-26T15:00:01Z"))).toBe(
      24 * 60 * 60 * 1000 - 1000,
    );
  });

  it("남은 시간을 HH:MM:SS로 표기한다", () => {
    expect(formatCountdown(0)).toBe("00:00:00");
    expect(formatCountdown(-5000)).toBe("00:00:00");
    expect(formatCountdown(3 * 3600 * 1000 + 4 * 60 * 1000 + 5000)).toBe(
      "03:04:05",
    );
  });
});

describe("recentDailyDates", () => {
  it("오늘부터 과거로 날짜를 최신순으로 만든다", () => {
    expect(recentDailyDates(3, new Date("2026-08-26T05:00:00Z"))).toEqual([
      "2026-08-26",
      "2026-08-25",
      "2026-08-24",
    ]);
    expect(recentDailyDates(0)).toEqual([]);
  });

  it("만든 날짜는 모두 결정적인 시드를 가진다", () => {
    const [today, yesterday] = recentDailyDates(2, new Date("2026-08-26T05:00:00Z"));
    expect(getDailySeed(yesterday)).toBe(getDailySeed(yesterday));
    expect(getDailySeed(today)).not.toBe(getDailySeed(yesterday));
  });
});
