import type { GameMode } from "./mode";

export interface GameClearEventPayload {
  mode: GameMode;
  seconds: number;
  maxCombo: number;
}

/** game_clear 분석 이벤트의 안정적인 숫자 payload를 만듭니다. */
export function createGameClearEventPayload(
  mode: GameMode,
  seconds: number,
  maxCombo: number,
): GameClearEventPayload {
  return {
    mode,
    seconds: Math.round(seconds),
    maxCombo,
  };
}
