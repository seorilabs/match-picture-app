import { describe, expect, it } from "vitest";

import {
  MAX_STARS_PER_STAGE,
  STAGES,
  applyStageClear,
  evaluateStars,
  getStage,
  isStageUnlocked,
  nextStageId,
  normalizeStageProgress,
  stageSeed,
  starsForStage,
  totalStars,
} from "./stages";

const FIRST = STAGES[0];

describe("스테이지 데이터", () => {
  it("번호가 1부터 연속이고 목표 시간이 앞뒤로 일관된다", () => {
    STAGES.forEach((stage, index) => {
      expect(stage.id).toBe(index + 1);
      expect(stage.threeStarSeconds).toBeLessThan(stage.twoStarSeconds);
      expect(stage.totalCards).toBeGreaterThan(0);
      expect(stage.coinPerStar).toBeGreaterThan(0);
    });
  });

  it("같은 스테이지는 항상 같은 덱 시드를 쓴다", () => {
    expect(stageSeed(3)).toBe(stageSeed(3));
    expect(stageSeed(3)).not.toBe(stageSeed(4));
  });
});

describe("evaluateStars", () => {
  it("클리어하면 최소 1개, 목표 시간·무오답을 만족하면 3개다", () => {
    expect(evaluateStars(FIRST, FIRST.twoStarSeconds + 10, 5)).toBe(1);
    expect(evaluateStars(FIRST, FIRST.twoStarSeconds, 5)).toBe(2);
    expect(
      evaluateStars(FIRST, FIRST.threeStarSeconds, FIRST.threeStarMaxWrong),
    ).toBe(3);
    expect(
      evaluateStars(FIRST, FIRST.threeStarSeconds, FIRST.threeStarMaxWrong + 1),
    ).toBe(2);
  });
});

describe("진행 상태", () => {
  it("손상된 저장본을 안전하게 정규화한다", () => {
    expect(
      normalizeStageProgress({ "1": 9, "2": "x", "999": 3, bad: 1 }),
    ).toEqual({ "1": MAX_STARS_PER_STAGE });
    expect(normalizeStageProgress(null)).toEqual({});
  });

  it("첫 스테이지는 항상 열려 있고 다음은 클리어해야 열린다", () => {
    expect(isStageUnlocked({}, 1)).toBe(true);
    expect(isStageUnlocked({}, 2)).toBe(false);
    expect(isStageUnlocked({ "1": 1 }, 2)).toBe(true);
    expect(isStageUnlocked({}, 999)).toBe(false);
  });

  it("다음 도전 스테이지는 아직 클리어하지 않은 첫 스테이지다", () => {
    expect(nextStageId({})).toBe(1);
    expect(nextStageId({ "1": 3, "2": 1 })).toBe(3);
  });
});

describe("applyStageClear", () => {
  it("별은 최고 기록만 남고 새로 늘어난 별만큼 코인을 준다", () => {
    const first = applyStageClear({}, 1, FIRST.twoStarSeconds, 5);
    expect(first.stars).toBe(2);
    expect(first.gainedStars).toBe(2);
    expect(first.coins).toBe(2 * FIRST.coinPerStar);
    expect(first.unlockedStageId).toBe(2);

    const worse = applyStageClear(first.progress, 1, FIRST.twoStarSeconds + 30, 9);
    expect(starsForStage(worse.progress, 1)).toBe(2);
    expect(worse.gainedStars).toBe(0);
    expect(worse.coins).toBe(0);
    expect(worse.unlockedStageId).toBeNull();

    const better = applyStageClear(
      worse.progress,
      1,
      FIRST.threeStarSeconds,
      FIRST.threeStarMaxWrong,
    );
    expect(starsForStage(better.progress, 1)).toBe(3);
    expect(better.gainedStars).toBe(1);
    expect(better.coins).toBe(FIRST.coinPerStar);
  });

  it("없는 스테이지는 진행 상태를 바꾸지 않는다", () => {
    const progress = { "1": 2 };
    const result = applyStageClear(progress, 999, 10, 0);
    expect(result.progress).toBe(progress);
    expect(result.coins).toBe(0);
  });

  it("총 별 수를 집계한다", () => {
    expect(totalStars({ "1": 3, "2": 2 })).toBe(5);
    expect(getStage(1)).not.toBeNull();
  });
});
