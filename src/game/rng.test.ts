import { describe, expect, it } from "vitest";

import { createDeck } from "./deck";
import { hashSeed, MAX_SEED, mulberry32, randomSeed } from "./rng";

describe("hashSeed", () => {
  it("같은 문자열은 항상 같은 시드를 돌려준다", () => {
    expect(hashSeed("match-picture-daily-2026-06-10")).toBe(
      hashSeed("match-picture-daily-2026-06-10"),
    );
  });

  it("다른 문자열은 다른 시드를 돌려준다", () => {
    expect(hashSeed("2026-06-10")).not.toBe(hashSeed("2026-06-11"));
  });

  it("32비트 부호 없는 정수 범위를 지킨다", () => {
    for (const input of ["", "a", "한국어", "2026-06-10"]) {
      const seed = hashSeed(input);
      expect(Number.isInteger(seed)).toBe(true);
      expect(seed).toBeGreaterThanOrEqual(0);
      expect(seed).toBeLessThanOrEqual(MAX_SEED);
    }
  });
});

describe("mulberry32", () => {
  it("같은 시드는 같은 난수열을 만든다", () => {
    const a = mulberry32(12345);
    const b = mulberry32(12345);
    for (let i = 0; i < 100; i++) {
      expect(a()).toBe(b());
    }
  });

  it("다른 시드는 다른 난수열을 만든다", () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    const sequenceA = Array.from({ length: 10 }, () => a());
    const sequenceB = Array.from({ length: 10 }, () => b());
    expect(sequenceA).not.toEqual(sequenceB);
  });

  it("[0, 1) 범위의 값을 만든다", () => {
    const rng = mulberry32(987654321);
    for (let i = 0; i < 1000; i++) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it("같은 시드로 만든 덱은 카드 순서까지 동일하다", () => {
    const deckA = createDeck({
      prime: 7,
      symbolsPerCard: 8,
      maxCards: 10,
      rng: mulberry32(42),
    });
    const deckB = createDeck({
      prime: 7,
      symbolsPerCard: 8,
      maxCards: 10,
      rng: mulberry32(42),
    });
    expect(deckA).toEqual(deckB);
  });

  it("다른 시드로 만든 덱은 순서가 달라진다", () => {
    const deckA = createDeck({
      prime: 7,
      symbolsPerCard: 8,
      maxCards: 10,
      rng: mulberry32(1),
    });
    const deckB = createDeck({
      prime: 7,
      symbolsPerCard: 8,
      maxCards: 10,
      rng: mulberry32(2),
    });
    expect(deckA).not.toEqual(deckB);
  });
});

describe("randomSeed", () => {
  it("32비트 부호 없는 정수 범위의 정수를 돌려준다", () => {
    for (let i = 0; i < 100; i++) {
      const seed = randomSeed();
      expect(Number.isInteger(seed)).toBe(true);
      expect(seed).toBeGreaterThanOrEqual(0);
      expect(seed).toBeLessThanOrEqual(MAX_SEED);
    }
  });
});
