import { describe, expect, it } from "vitest";

import {
  MAX_SYMBOL_RADIUS,
  MAX_SYMBOL_SCALE,
  arrangeSymbols,
  baseSymbolPositions,
  placementRng,
  placementSeed,
  requiredDistance,
} from "./placement";

import { mulberry32 } from "./rng";

const CARD = ["001", "002", "003", "004", "005", "006", "007", "008"];

function minPairDistance(
  placements: ReturnType<typeof arrangeSymbols>,
): { distance: number; required: number } {
  let worst = { distance: Number.POSITIVE_INFINITY, required: 0 };
  for (let i = 0; i < placements.length; i++) {
    for (let j = i + 1; j < placements.length; j++) {
      const a = placements[i];
      const b = placements[j];
      const distance = Math.hypot(
        a.position.x - b.position.x,
        a.position.y - b.position.y,
      );
      const required = requiredDistance(a.scale, b.scale);
      if (distance - required < worst.distance - worst.required) {
        worst = { distance, required };
      }
    }
  }
  return worst;
}

describe("baseSymbolPositions", () => {
  it("8심볼은 Unity 원본 배치를 그대로 쓴다", () => {
    expect(baseSymbolPositions(8)).toHaveLength(8);
    expect(baseSymbolPositions(8)[0]).toEqual({ x: -217, y: 58 });
  });

  it("다른 심볼 수도 카드 반경 안에서 배치를 만든다", () => {
    for (const count of [6, 10, 12]) {
      const positions = baseSymbolPositions(count);
      expect(positions).toHaveLength(count);
      for (const position of positions) {
        expect(Math.hypot(position.x, position.y)).toBeLessThanOrEqual(
          MAX_SYMBOL_RADIUS + 0.001,
        );
      }
    }
  });
});

describe("arrangeSymbols 결정성", () => {
  it("같은 시드는 항상 같은 배치를 만든다", () => {
    const first = arrangeSymbols(CARD, { progress: 0.8, rng: mulberry32(42) });
    const second = arrangeSymbols(CARD, { progress: 0.8, rng: mulberry32(42) });
    expect(second).toEqual(first);
  });

  it("다른 시드는 다른 배치를 만든다", () => {
    const first = arrangeSymbols(CARD, { progress: 0.8, rng: mulberry32(1) });
    const second = arrangeSymbols(CARD, { progress: 0.8, rng: mulberry32(2) });
    expect(second).not.toEqual(first);
  });

  it("같은 덱 시드와 카드면 같은 배치 RNG를 쓴다", () => {
    expect(placementSeed(7, CARD)).toBe(placementSeed(7, CARD));
    expect(placementSeed(7, CARD)).not.toBe(placementSeed(8, CARD));
    const a = arrangeSymbols(CARD, { rng: placementRng(7, CARD), progress: 0.5 });
    const b = arrangeSymbols(CARD, { rng: placementRng(7, CARD), progress: 0.5 });
    expect(b).toEqual(a);
  });
});

describe("arrangeSymbols 최소 간격", () => {
  it("진행률 전 구간에서 심볼이 겹치지 않는다", () => {
    for (let step = 0; step <= 20; step++) {
      const progress = step / 20;
      for (let seed = 0; seed < 15; seed++) {
        const placements = arrangeSymbols(CARD, {
          progress,
          jitterScale: 1.35,
          rng: mulberry32(seed * 7919 + step),
        });
        const worst = minPairDistance(placements);
        expect(worst.distance).toBeGreaterThanOrEqual(worst.required);
      }
    }
  });

  it("스케일 상한을 넘지 않고 카드 밖으로 나가지 않는다", () => {
    const placements = arrangeSymbols(CARD, {
      progress: 1,
      rng: mulberry32(99),
    });
    for (const placement of placements) {
      expect(placement.scale).toBeLessThanOrEqual(MAX_SYMBOL_SCALE);
      expect(
        Math.hypot(placement.position.x, placement.position.y),
      ).toBeLessThanOrEqual(MAX_SYMBOL_RADIUS + 0.001);
    }
  });

  it("재샘플링이 모두 실패해도 기본 배치로 폴백해 배치가 성공한다", () => {
    // rng가 항상 극단값을 돌려주면 지터 후보가 같은 지점으로 몰린다.
    const stuckRng = () => 0.999999;
    const placements = arrangeSymbols(CARD, {
      progress: 1,
      rng: stuckRng,
    });
    // 배치는 항상 성공하고, 모든 심볼이 카드 안에 남는다.
    expect(placements).toHaveLength(CARD.length);
    for (const placement of placements) {
      expect(
        Math.hypot(placement.position.x, placement.position.y),
      ).toBeLessThanOrEqual(MAX_SYMBOL_RADIUS + 0.001);
    }
  });
});
