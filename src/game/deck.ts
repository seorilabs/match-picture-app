/**
 * Unity 원본 `Assets/Scripts/Deck.cs`의 동작을 그대로 옮긴 모듈입니다.
 *
 * 원본은 소수 `p` 기반의 유한 사영 평면(Dobble/Spot it 방식)으로
 * 카드 한 장당 `p + 1`개의 심볼이 들어가고, 두 카드 사이에는 정확히
 * 한 개의 공통 심볼이 존재하도록 카드 묶음을 만듭니다.
 *
 * 게임에서 호출되는 형태는 `createDeck(7, 8, 10)`이며, Unity 코드의
 * `RemoveRange(numberOfCards + 1, …)` 때문에 실제 큐에는 `numberOfCards + 1`장이
 * 들어갑니다. 게임 진행 의미가 거기에 맞춰져 있어서 동일하게 유지합니다.
 */

export type Card = readonly string[];

export type Rng = () => number;

export interface DeckOptions {
  /** Dobble 생성을 위한 소수입니다. 게임에서는 7을 사용합니다. */
  prime: number;
  /**
   * 한 카드당 노출되는 심볼 개수입니다. Unity 원본은 인자만 받고 실제로는
   * `prime + 1`로 동작하므로 검증용으로만 둡니다. 게임에서는 8을 넣습니다.
   */
  symbolsPerCard: number;
  /**
   * 최종 큐에 남길 카드 수의 기준 값입니다. Unity 원본 동작과 동일하게
   * 실제 잔존 카드 수는 `maxCards + 1`이 됩니다. 게임에서는 10을 넣습니다.
   */
  maxCards?: number;
  /** 0 이상 1 미만의 난수를 반환하는 함수입니다. 테스트에서는 시드 RNG를 주입합니다. */
  rng?: Rng;
}

const DEFAULT_RNG: Rng = Math.random;

/** Unity의 `string.Format("{0,3:d3}", i)`와 같은 3자리 0 패딩 포맷입니다. */
export function symbolName(index: number): string {
  return index.toString().padStart(3, "0");
}

/**
 * Unity 원본의 `ShuffleList`와 동일한 셔플입니다.
 * `i > 1` 조건 때문에 인덱스 0,1은 자리이동되지 않는 미묘한 동작까지 보존합니다.
 */
function shuffleInPlace<T>(list: T[], rng: Rng): void {
  for (let i = list.length - 1; i > 1; i--) {
    const rnd = Math.floor(rng() * (i + 1));
    const value = list[rnd];
    list[rnd] = list[i];
    list[i] = value;
  }
}

/**
 * Unity 원본 `Deck.NewDeck`과 동일한 절차로 카드 묶음을 만듭니다.
 *
 * - 첫 그룹: `prime + 1`장의 카드가 모두 `001`을 공통 심볼로 가집니다.
 * - 두 번째 그룹: `prime * prime`장이 정해진 산술식에 따라 채워집니다.
 * - 전체 카드 수는 `prime^2 + prime + 1`입니다.
 *
 * 마지막에 `maxCards`가 주어지면 Unity와 동일하게 잘라 `maxCards + 1`장만 남깁니다.
 */
export function createDeck(options: DeckOptions): Card[] {
  const { prime, maxCards } = options;
  const rng = options.rng ?? DEFAULT_RNG;

  if (!Number.isInteger(prime) || prime <= 1) {
    throw new Error(`prime은 1보다 큰 정수여야 합니다. 받은 값: ${prime}`);
  }

  const cards: string[][] = [];

  for (let i = 0; i < prime + 1; i++) {
    const card: string[] = [symbolName(1)];
    for (let j = 0; j < prime; j++) {
      card.push(symbolName(j + 1 + i * prime + 1));
    }
    shuffleInPlace(card, rng);
    cards.push(card);
  }

  for (let k = 2; k < prime + 2; k++) {
    for (let i = 0; i < prime; i++) {
      const card: string[] = [symbolName(k)];
      for (let j = 0; j < prime; j++) {
        let val = prime + 2 + i + (k + prime) * j;
        while (val >= prime + 2 + (j + 1) * prime) {
          val -= prime;
        }
        card.push(symbolName(val));
      }
      shuffleInPlace(card, rng);
      cards.push(card);
    }
  }

  shuffleInPlace(cards, rng);

  if (typeof maxCards === "number" && cards.length > maxCards) {
    // Unity 원본: cards.RemoveRange(numberOfCards + 1, cards.Count - numberOfCards - 1)
    // 결과적으로 numberOfCards + 1 장이 남습니다. 게임 흐름이 이 quirks를 전제하므로 그대로 둡니다.
    cards.length = maxCards + 1;
  }

  return cards;
}

/**
 * 두 카드의 공통 심볼을 반환합니다. Dobble 규칙상 정확히 하나여야 합니다.
 * 공통 심볼이 없으면 `null`을 반환합니다.
 */
export function findCommonSymbol(a: Card, b: Card): string | null {
  const set = new Set(a);
  for (const symbol of b) {
    if (set.has(symbol)) return symbol;
  }
  return null;
}
