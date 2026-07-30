import { describe, expect, it } from "vitest";

import type { RoundState } from "./rules";
import { POWER_UPS, planPowerUpUse } from "./powerUps";

const round: RoundState = {
  opponent: ["1", "8", "9"],
  mine: ["1", "2", "3", "4"],
  hint: "1",
};

describe("planPowerUpUse", () => {
  it("힌트 가격을 정확히 차감하고 즉시 강조 효과를 계획한다", () => {
    const result = planPowerUpUse({
      id: "hint",
      coins: 40,
      mode: "classic",
      round,
      usedPowerUps: [],
      eliminatedSymbols: [],
    });

    expect(result).toEqual({
      ok: true,
      price: POWER_UPS.hint.price,
      remainingCoins: 25,
      effect: { id: "hint" },
    });
  });

  it("소거 가격을 차감하고 정답을 제외한 오답 두 개를 고른다", () => {
    const result = planPowerUpUse({
      id: "eliminate",
      coins: 100,
      mode: "classic",
      round,
      usedPowerUps: [],
      eliminatedSymbols: [],
    });

    expect(result).toEqual({
      ok: true,
      price: POWER_UPS.eliminate.price,
      remainingCoins: 75,
      effect: {
        id: "eliminate",
        eliminatedSymbols: ["2", "3"],
      },
    });
  });

  it("코인이 부족하면 차감하거나 효과를 만들지 않는다", () => {
    const result = planPowerUpUse({
      id: "eliminate",
      coins: POWER_UPS.eliminate.price - 1,
      mode: "classic",
      round,
      usedPowerUps: [],
      eliminatedSymbols: [],
    });

    expect(result).toEqual({
      ok: false,
      reason: "not-enough-coins",
      remainingCoins: POWER_UPS.eliminate.price - 1,
      effect: null,
    });
  });

  it.each(["daily", "challenge"] as const)(
    "%s 랭킹 모드에서는 파워업을 제한한다",
    (mode) => {
      expect(
        planPowerUpUse({
          id: "hint",
          coins: 100,
          mode,
          round,
          usedPowerUps: [],
          eliminatedSymbols: [],
        }),
      ).toMatchObject({ ok: false, reason: "ranked-mode" });
    },
  );

  it("같은 라운드에서 이미 사용한 파워업은 다시 구매하지 않는다", () => {
    expect(
      planPowerUpUse({
        id: "hint",
        coins: 100,
        mode: "classic",
        round,
        usedPowerUps: ["hint"],
        eliminatedSymbols: [],
      }),
    ).toMatchObject({
      ok: false,
      reason: "already-used",
      remainingCoins: 100,
      effect: null,
    });
  });
});
