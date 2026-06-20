import { describe, expect, it } from "vitest";

import {
  GARDEN_PLOTS,
  createGarden,
  ensureDailyReset,
  fertilize,
  hasEmptyPlot,
  isMature,
  normalizeGarden,
  plantSeed,
  removePlant,
  waterAll,
} from "./garden";
import { getSpecies } from "../garden/species";

describe("createGarden", () => {
  it("화분 수만큼 슬롯을 만들고 첫 칸에 무료 스타터를 심는다", () => {
    const g = createGarden();
    expect(g.plots).toHaveLength(GARDEN_PLOTS);
    expect(g.plots[0]?.speciesId).toBe("sprout");
    expect(g.plots[1]).toBeNull();
    expect(g.wateredToday).toBe(false);
  });
});

describe("ensureDailyReset", () => {
  it("날짜가 다르면 wateredToday를 false로 리셋한다", () => {
    const g = { ...createGarden(), date: "2026-06-19", wateredToday: true };
    expect(ensureDailyReset(g, "2026-06-19").wateredToday).toBe(true);
    expect(ensureDailyReset(g, "2026-06-20").wateredToday).toBe(false);
  });
});

describe("waterAll", () => {
  it("오늘 처음이면 모든 식물에 물 +1, 두 번째는 무효", () => {
    const g = createGarden();
    const first = waterAll(g);
    expect(first.garden.wateredToday).toBe(true);
    expect(first.garden.plots[0]?.water).toBe(1);
    const second = waterAll(first.garden);
    expect(second.garden.plots[0]?.water).toBe(1); // 변화 없음
  });

  it("충분히 물을 주면 단계가 오르고, 다 자라면 보상+도감 추가", () => {
    // sprout: 3단계(0,1,2), waterPerStage 3 → 다 자라려면 6번.
    let g = createGarden();
    let totalReward = 0;
    for (let day = 0; day < 6; day++) {
      const r = waterAll(g);
      totalReward += r.reward;
      g = { ...r.garden, date: "x", wateredToday: false }; // 다음날 시뮬레이션
    }
    const species = getSpecies("sprout");
    expect(isMature(g.plots[0]!, species)).toBe(true);
    expect(totalReward).toBe(species.reward);
    expect(g.collected).toContain("sprout");
  });
});

describe("fertilize", () => {
  it("물 +1 즉시 적용, 충분히 주면 다 자라며 보상", () => {
    let g = createGarden(); // sprout: 단계3, 물/단계2 → 4번이면 만개
    let total = 0;
    for (let i = 0; i < 4; i++) {
      const r = fertilize(g, 0);
      expect(r.applied).toBe(true);
      total += r.reward;
      g = r.garden;
    }
    expect(isMature(g.plots[0]!, getSpecies("sprout"))).toBe(true);
    expect(total).toBe(getSpecies("sprout").reward);
  });

  it("빈 화분/다 자란 화분은 applied=false", () => {
    const g = createGarden();
    expect(fertilize(g, 1).applied).toBe(false); // 빈 화분
  });
});

describe("plantSeed / removePlant", () => {
  it("빈 화분에 심고, 빈 화분이 없으면 실패한다", () => {
    let g = createGarden(); // plot0 차 있음, 1·2 비어있음
    const r1 = plantSeed(g, "tree");
    expect(r1.ok).toBe(true);
    g = r1.garden;
    g = plantSeed(g, "rose").garden; // 마지막 빈 칸
    expect(hasEmptyPlot(g)).toBe(false);
    const full = plantSeed(g, "cactus");
    expect(full.ok).toBe(false);
    expect(full.reason).toBe("no-empty-plot");
  });

  it("화분을 치우면 다시 빈 칸이 생긴다", () => {
    const g = createGarden();
    const removed = removePlant(g, 0);
    expect(removed.plots[0]).toBeNull();
    expect(hasEmptyPlot(removed)).toBe(true);
  });
});

describe("normalizeGarden", () => {
  it("손상 입력을 안전한 정원으로 정규화한다", () => {
    const g = normalizeGarden({ plots: ["x", { speciesId: "nope" }], collected: 5 });
    expect(g.plots).toHaveLength(GARDEN_PLOTS);
    expect(g.plots.every((p) => p === null)).toBe(true);
    expect(g.collected).toEqual([]);
  });
});
