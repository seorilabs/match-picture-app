/**
 * 난이도 정의입니다.
 *
 * Dobble 덱은 소수 `prime`으로 결정되고 카드당 심볼 수는 `prime + 1`이 됩니다.
 * 심볼 에셋이 팩당 57장(= 7² + 7 + 1)뿐이라 실제로 쓸 수 있는 소수는 5와 7입니다.
 * 그래서 "어려움"은 카드당 심볼 수 대신 라운드 수와 배치 흩뜨림으로 난이도를 올립니다.
 */

import type { GameMode } from "./mode";
import { TOTAL_CARDS } from "./rules";

export type DifficultyId = "easy" | "normal" | "hard";

export const DIFFICULTY_STORAGE_KEY = "match-picture/difficulty";

export interface DifficultyDef {
  id: DifficultyId;
  /** Dobble 생성 소수. 카드당 심볼 수는 prime + 1입니다. */
  prime: number;
  /** 한 판의 라운드 수. */
  totalCards: number;
  /** 후반 배치 흩뜨림 배수(1이 기본). */
  jitterScale: number;
  /** 클리어 보상 코인에 곱하는 가중치. */
  rewardMultiplier: number;
}

export const DIFFICULTIES: DifficultyDef[] = [
  { id: "easy", prime: 5, totalCards: 8, jitterScale: 0.6, rewardMultiplier: 0.8 },
  { id: "normal", prime: 7, totalCards: TOTAL_CARDS, jitterScale: 1, rewardMultiplier: 1 },
  { id: "hard", prime: 7, totalCards: 14, jitterScale: 1.35, rewardMultiplier: 1.4 },
];

export const DEFAULT_DIFFICULTY_ID: DifficultyId = "normal";

const DEFAULT_DIFFICULTY = DIFFICULTIES.find(
  (difficulty) => difficulty.id === DEFAULT_DIFFICULTY_ID,
) as DifficultyDef;

export function getDifficulty(id: string | null | undefined): DifficultyDef {
  return DIFFICULTIES.find((difficulty) => difficulty.id === id) ?? DEFAULT_DIFFICULTY;
}

export function isDifficultyId(value: unknown): value is DifficultyId {
  return DIFFICULTIES.some((difficulty) => difficulty.id === value);
}

/** 카드당 심볼 수(= prime + 1). */
export function symbolsPerCard(difficulty: DifficultyDef): number {
  return difficulty.prime + 1;
}

/**
 * 모드별로 실제 적용할 난이도입니다.
 * 데일리·도전장은 모든 사용자가 같은 조건으로 겨뤄야 하므로 보통 난이도로 고정합니다.
 * 스테이지 모드는 스테이지 데이터가 난이도를 직접 지정합니다.
 */
export function effectiveDifficulty(
  mode: GameMode,
  selected: DifficultyId,
): DifficultyDef {
  if (mode === "daily" || mode === "challenge") {
    return getDifficulty(DEFAULT_DIFFICULTY_ID);
  }
  return getDifficulty(selected);
}

export function isPrime(value: number): boolean {
  if (!Number.isInteger(value) || value < 2) return false;
  for (let divisor = 2; divisor * divisor <= value; divisor++) {
    if (value % divisor === 0) return false;
  }
  return true;
}
