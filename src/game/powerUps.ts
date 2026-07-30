import type { GameMode } from "./mode";
import type { RoundState } from "./rules";

export const POWER_UPS = {
  hint: {
    price: 15,
  },
  eliminate: {
    price: 25,
    eliminateCount: 2,
  },
} as const;

export type PowerUpId = keyof typeof POWER_UPS;

export type PowerUpEffect =
  | { id: "hint" }
  | { id: "eliminate"; eliminatedSymbols: string[] };

export type PowerUpFailureReason =
  | "ranked-mode"
  | "round-unavailable"
  | "already-used"
  | "not-enough-coins"
  | "effect-unavailable";

export type PowerUpPlan =
  | {
      ok: true;
      price: number;
      remainingCoins: number;
      effect: PowerUpEffect;
    }
  | {
      ok: false;
      reason: PowerUpFailureReason;
      remainingCoins: number;
      effect: null;
    };

interface PlanPowerUpUseOptions {
  id: PowerUpId;
  coins: number;
  mode: GameMode;
  round: RoundState | null;
  usedPowerUps: readonly PowerUpId[];
  eliminatedSymbols: readonly string[];
}

function failure(reason: PowerUpFailureReason, coins: number): PowerUpPlan {
  return {
    ok: false,
    reason,
    remainingCoins: coins,
    effect: null,
  };
}

/**
 * 파워업의 가격, 랭킹 정책, 라운드 효과를 한 번에 계산하는 순수 함수입니다.
 *
 * 데일리와 도전장은 고정 시드 기록 경쟁이므로 파워업을 허용하지 않습니다.
 * 클래식에서는 각 파워업을 라운드당 한 번만 쓸 수 있습니다.
 */
export function planPowerUpUse({
  id,
  coins,
  mode,
  round,
  usedPowerUps,
  eliminatedSymbols,
}: PlanPowerUpUseOptions): PowerUpPlan {
  if (mode !== "classic") return failure("ranked-mode", coins);
  if (round === null) return failure("round-unavailable", coins);
  if (usedPowerUps.includes(id)) return failure("already-used", coins);

  const config = POWER_UPS[id];
  if (coins < config.price) return failure("not-enough-coins", coins);

  if (id === "hint") {
    return {
      ok: true,
      price: config.price,
      remainingCoins: coins - config.price,
      effect: { id },
    };
  }

  const remainingWrongSymbols = round.mine.filter(
    (symbol) => symbol !== round.hint && !eliminatedSymbols.includes(symbol),
  );
  const nextEliminated = remainingWrongSymbols.slice(
    0,
    POWER_UPS.eliminate.eliminateCount,
  );
  if (nextEliminated.length === 0) {
    return failure("effect-unavailable", coins);
  }

  return {
    ok: true,
    price: config.price,
    remainingCoins: coins - config.price,
    effect: {
      id,
      eliminatedSymbols: nextEliminated,
    },
  };
}
