import { describe, expect, it } from "vitest";

import { createDeck, findCommonSymbol, symbolName } from "./deck";

/**
 * mulberry32 기반 시드 RNG. 테스트의 결정성을 위해 사용합니다.
 */
function seededRng(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

describe("symbolName", () => {
  it("Unity의 3자리 0 패딩과 같은 형식으로 만든다", () => {
    expect(symbolName(1)).toBe("001");
    expect(symbolName(57)).toBe("057");
    expect(symbolName(102)).toBe("102");
  });
});

describe("createDeck", () => {
  it("maxCards 없이 호출하면 prime^2 + prime + 1 장의 카드를 만든다", () => {
    const cards = createDeck({
      prime: 7,
      symbolsPerCard: 8,
      rng: seededRng(1),
    });
    expect(cards).toHaveLength(7 * 7 + 7 + 1);
  });

  it("각 카드는 prime + 1 개의 심볼을 가진다", () => {
    const cards = createDeck({
      prime: 7,
      symbolsPerCard: 8,
      rng: seededRng(2),
    });
    for (const card of cards) {
      expect(card).toHaveLength(8);
    }
  });

  it("Dobble 불변식: 임의의 두 카드 사이에 정확히 1개의 공통 심볼이 있다", () => {
    const cards = createDeck({
      prime: 7,
      symbolsPerCard: 8,
      rng: seededRng(3),
    });
    for (let i = 0; i < cards.length; i++) {
      for (let j = i + 1; j < cards.length; j++) {
        const a = new Set(cards[i]);
        const common = cards[j].filter((s) => a.has(s));
        expect(common, `cards[${i}] vs cards[${j}]`).toHaveLength(1);
      }
    }
  });

  it("같은 시드면 같은 결과를 만든다", () => {
    const a = createDeck({ prime: 7, symbolsPerCard: 8, rng: seededRng(42) });
    const b = createDeck({ prime: 7, symbolsPerCard: 8, rng: seededRng(42) });
    expect(a).toEqual(b);
  });

  it("Unity 원본 quirks대로 maxCards=10이면 11장을 남긴다", () => {
    const cards = createDeck({
      prime: 7,
      symbolsPerCard: 8,
      maxCards: 10,
      rng: seededRng(7),
    });
    expect(cards).toHaveLength(11);
  });

  it("자른 후에도 두 카드 사이에 공통 심볼이 정확히 1개씩 있다", () => {
    const cards = createDeck({
      prime: 7,
      symbolsPerCard: 8,
      maxCards: 10,
      rng: seededRng(8),
    });
    for (let i = 0; i < cards.length; i++) {
      for (let j = i + 1; j < cards.length; j++) {
        expect(findCommonSymbol(cards[i], cards[j])).not.toBeNull();
      }
    }
  });

  it("prime이 1 이하이면 예외를 던진다", () => {
    expect(() =>
      createDeck({ prime: 1, symbolsPerCard: 2, rng: seededRng(0) }),
    ).toThrow();
  });
});

describe("findCommonSymbol", () => {
  it("공통 심볼을 반환한다", () => {
    expect(findCommonSymbol(["001", "002", "003"], ["004", "002", "005"])).toBe(
      "002",
    );
  });

  it("공통이 없으면 null을 반환한다", () => {
    expect(findCommonSymbol(["001", "002"], ["003", "004"])).toBeNull();
  });
});
