import { describe, expect, it } from "vitest";

import {
  DEFAULT_DIFFICULTY_ID,
  DIFFICULTIES,
  effectiveDifficulty,
  getDifficulty,
  isDifficultyId,
  isPrime,
  symbolsPerCard,
} from "./difficulty";
import { createDeck, findCommonSymbol } from "./deck";
import { mulberry32 } from "./rng";
import { SYMBOL_COUNT } from "../symbols/packs";

describe("난이도 테이블", () => {
  it("모든 난이도의 prime이 소수다", () => {
    for (const difficulty of DIFFICULTIES) {
      expect(isPrime(difficulty.prime)).toBe(true);
    }
  });

  it("난이도별 카드당 심볼 수가 prime + 1이다", () => {
    expect(symbolsPerCard(getDifficulty("easy"))).toBe(6);
    expect(symbolsPerCard(getDifficulty("normal"))).toBe(8);
  });

  it("덱이 쓰는 심볼 수가 보유한 에셋 수를 넘지 않는다", () => {
    for (const difficulty of DIFFICULTIES) {
      const total = difficulty.prime * difficulty.prime + difficulty.prime + 1;
      expect(total).toBeLessThanOrEqual(SYMBOL_COUNT);
    }
  });

  it("알 수 없는 값은 기본 난이도로 떨어진다", () => {
    expect(getDifficulty("nope").id).toBe(DEFAULT_DIFFICULTY_ID);
    expect(getDifficulty(null).id).toBe(DEFAULT_DIFFICULTY_ID);
    expect(isDifficultyId("hard")).toBe(true);
    expect(isDifficultyId("insane")).toBe(false);
  });

  it("데일리·도전장은 공정성을 위해 보통 난이도로 고정된다", () => {
    expect(effectiveDifficulty("daily", "hard").id).toBe("normal");
    expect(effectiveDifficulty("challenge", "easy").id).toBe("normal");
    expect(effectiveDifficulty("classic", "hard").id).toBe("hard");
  });

  it("어려움은 라운드 수와 흩뜨림으로 난이도를 올린다", () => {
    const normal = getDifficulty("normal");
    const hard = getDifficulty("hard");
    expect(hard.totalCards).toBeGreaterThan(normal.totalCards);
    expect(hard.jitterScale).toBeGreaterThan(normal.jitterScale);
    expect(hard.rewardMultiplier).toBeGreaterThan(normal.rewardMultiplier);
  });
});

describe("난이도별 덱 불변식", () => {
  it("prime 5 덱도 두 카드의 공통 심볼이 정확히 하나다", () => {
    const deck = createDeck({ prime: 5, symbolsPerCard: 6, rng: mulberry32(5) });
    expect(deck).toHaveLength(31);
    for (const card of deck) expect(card).toHaveLength(6);
    for (let i = 0; i < deck.length; i++) {
      for (let j = i + 1; j < deck.length; j++) {
        const shared = deck[i].filter((symbol) => deck[j].includes(symbol));
        expect(shared).toHaveLength(1);
        expect(findCommonSymbol(deck[i], deck[j])).toBe(shared[0]);
      }
    }
  });

  it("prime 11 덱도 Dobble 불변식을 만족한다(에셋 제약과 무관한 로직 검증)", () => {
    const deck = createDeck({ prime: 11, symbolsPerCard: 12, rng: mulberry32(11) });
    expect(deck).toHaveLength(133);
    for (let i = 0; i < 20; i++) {
      for (let j = i + 1; j < 20; j++) {
        const shared = deck[i].filter((symbol) => deck[j].includes(symbol));
        expect(shared).toHaveLength(1);
      }
    }
  });
});
