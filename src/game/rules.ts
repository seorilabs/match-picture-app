/**
 * 게임 상수와 한 턴 진행 헬퍼입니다.
 * Unity 원본 `GameSceneManager`의 게임 루프를 React 상태에서 다루기 쉬운 형태로 옮긴 것입니다.
 */

import { type Card, findCommonSymbol } from "./deck";

/** 한 카드당 심볼 수 (Unity의 SYMBOLS_PER_CARD). */
export const SYMBOLS_PER_CARD = 8;

/** Deck 생성 시의 maxCards 인자 (Unity의 TOTAL_CARDS). */
export const TOTAL_CARDS = 10;

/** Dobble 생성을 위한 소수. */
export const PRIME = 7;

/** 결과 화면에서 표기 가능한 최대 초 (`999s`). */
export const MAX_DISPLAY_SECONDS = 999;

/** 정답 심볼이 흔들리는 힌트 효과의 주기 (초). */
export const HINT_INTERVAL_SECONDS = 10;

/**
 * 한 라운드의 두 카드 상태입니다.
 * `opponent`는 화면 위쪽(상대)의 카드, `mine`은 아래쪽(내)의 카드입니다.
 * `hint`는 두 카드의 공통 심볼이며, 내 카드의 정답 버튼이 됩니다.
 */
export interface RoundState {
  opponent: Card;
  mine: Card;
  hint: string;
}

/**
 * 큐의 가장 앞 카드를 꺼내 새 라운드를 만듭니다.
 * Unity의 `StartGame`은 처음 두 장을 빼서 라운드를 구성하고, 이후
 * `HitMeNextCard`는 이전 상대 카드를 내 카드로 옮긴 뒤 한 장을 더 꺼냅니다.
 *
 * @param queue 다음 카드들이 담긴 큐. 함수가 직접 `shift`하므로 호출자는 복사본을 넘겨야 합니다.
 * @param previousOpponent 직전 상대 카드. 처음 시작이라면 `null`을 넘겨주세요.
 * @returns 새 라운드 정보. 큐가 비어 더 이상 진행 불가하면 `null`.
 */
export function takeNextRound(
  queue: Card[],
  previousOpponent: Card | null,
): RoundState | null {
  if (previousOpponent === null) {
    const opponent = queue.shift();
    const mine = queue.shift();
    if (!opponent || !mine) return null;
    const hint = findCommonSymbol(opponent, mine);
    if (hint === null) {
      throw new Error("두 카드 사이에 공통 심볼이 없습니다. Deck 생성이 잘못된 상태입니다.");
    }
    return { opponent, mine, hint };
  }

  const next = queue.shift();
  if (!next) return null;
  const mine = previousOpponent;
  const hint = findCommonSymbol(next, mine);
  if (hint === null) {
    throw new Error("두 카드 사이에 공통 심볼이 없습니다. Deck 생성이 잘못된 상태입니다.");
  }
  return { opponent: next, mine, hint };
}

/** 타이머 표시 문자열을 만듭니다. 999초를 넘기면 `999s`로 캡합니다. */
export function formatSeconds(seconds: number): string {
  const truncated = Math.floor(seconds);
  if (truncated > MAX_DISPLAY_SECONDS) return `${MAX_DISPLAY_SECONDS}s`;
  return `${truncated}s`;
}
