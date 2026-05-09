import { describe, expect, it } from "vitest";

import { createDeck } from "./deck";
import {
  PRIME,
  SYMBOLS_PER_CARD,
  TOTAL_CARDS,
  formatSeconds,
  takeNextRound,
} from "./rules";

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

describe("takeNextRound", () => {
  it("처음에는 큐에서 두 장을 꺼내 라운드를 만든다", () => {
    const deck = createDeck({
      prime: PRIME,
      symbolsPerCard: SYMBOLS_PER_CARD,
      maxCards: TOTAL_CARDS,
      rng: seededRng(1),
    });
    const queue = [...deck];
    const round = takeNextRound(queue, null);
    expect(round).not.toBeNull();
    expect(round!.opponent).toHaveLength(SYMBOLS_PER_CARD);
    expect(round!.mine).toHaveLength(SYMBOLS_PER_CARD);
    expect(round!.mine).toContain(round!.hint);
    expect(round!.opponent).toContain(round!.hint);
    expect(queue).toHaveLength(deck.length - 2);
  });

  it("이전 상대 카드가 새 라운드의 내 카드가 되고 큐에서 한 장 더 꺼낸다", () => {
    const deck = createDeck({
      prime: PRIME,
      symbolsPerCard: SYMBOLS_PER_CARD,
      maxCards: TOTAL_CARDS,
      rng: seededRng(2),
    });
    const queue = [...deck];
    const first = takeNextRound(queue, null)!;
    const beforeLen = queue.length;
    const second = takeNextRound(queue, first.opponent)!;
    expect(second.mine).toEqual(first.opponent);
    expect(queue).toHaveLength(beforeLen - 1);
  });

  it("진행하면서 마지막에는 더 이상 카드가 없으면 null을 반환한다", () => {
    const deck = createDeck({
      prime: PRIME,
      symbolsPerCard: SYMBOLS_PER_CARD,
      maxCards: TOTAL_CARDS,
      rng: seededRng(3),
    });
    const queue = [...deck];
    let prev = takeNextRound(queue, null)!.opponent;
    let round: ReturnType<typeof takeNextRound> | null;
    let safety = 50;
    do {
      round = takeNextRound(queue, prev);
      if (round) prev = round.opponent;
      safety -= 1;
    } while (round && safety > 0);
    expect(round).toBeNull();
    expect(safety).toBeGreaterThan(0);
  });
});

describe("formatSeconds", () => {
  it("초 단위로 잘라 표시한다", () => {
    expect(formatSeconds(0)).toBe("0s");
    expect(formatSeconds(12.7)).toBe("12s");
  });

  it("999를 넘으면 999s로 캡한다", () => {
    expect(formatSeconds(1000)).toBe("999s");
    expect(formatSeconds(99999)).toBe("999s");
  });
});
