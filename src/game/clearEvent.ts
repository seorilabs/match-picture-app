import type { GameMode } from "./mode";

export interface GameClearEventPayload {
  mode: GameMode;
  seconds: number;
  maxCombo: number;
  /** 이번 판에서 사용한 코인 파워업 횟수(경제 밸런스 튜닝 근거). */
  powerUpUseCount: number;
  [key: string]: string | number | boolean;
}

/** game_clear 분석 이벤트의 안정적인 숫자 payload를 만듭니다. */
export function createGameClearEventPayload(
  mode: GameMode,
  seconds: number,
  maxCombo: number,
  powerUpUseCount = 0,
): GameClearEventPayload {
  return {
    mode,
    seconds: Math.round(seconds),
    maxCombo,
    powerUpUseCount,
  };
}
