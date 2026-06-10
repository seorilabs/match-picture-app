import { useCallback, useEffect, useRef, useState } from "react";

import { type Card, createDeck } from "./deck";
import { mulberry32, randomSeed } from "./rng";
import {
  PRIME,
  SYMBOLS_PER_CARD,
  TOTAL_CARDS,
  type RoundState,
  takeNextRound,
} from "./rules";

/**
 * 게임 진행 단계입니다.
 * - `idle`: 큐가 비어 있는 초기 상태.
 * - `ready`: 큐와 첫 라운드를 준비했지만 사용자가 아직 카드를 열지 않은 상태.
 * - `playing`: 위/아래 카드가 노출되어 매칭이 진행되는 상태.
 * - `finished`: 모든 카드를 마쳐서 결과가 표시되는 상태.
 */
export type GameStatus = "idle" | "ready" | "playing" | "finished";

export interface FeedbackEvent {
  /** 피드백 식별자입니다. 같은 키가 두 번 들어와도 React가 갱신을 인지하도록 ID를 부여합니다. */
  id: number;
  kind: "correct" | "wrong";
  /** 화면에 잠깐 띄우는 기준 좌표(없으면 기본 위치 사용). */
  origin?: { x: number; y: number };
  /** 이 정답까지의 연속 정답 수. 오답이면 0. */
  combo: number;
}

export interface GameSnapshot {
  status: GameStatus;
  /** 남은 라운드 수입니다. 시작 직후 `TOTAL_CARDS`에서 시작해 정답마다 1씩 줄어듭니다. */
  remaining: number;
  /** 이번 게임의 전체 라운드 수. 난이도 진행률 계산에 사용합니다. */
  totalCards: number;
  /** 현재 라운드 정보. 시작 전 또는 종료 후에는 null. */
  round: RoundState | null;
  /** 현재 라운드 번호(0부터). 카드 전환 애니메이션의 키로 사용합니다. */
  roundIndex: number;
  /** 게임 시작 후 누적된 초 단위 시간 (실수). */
  elapsedSeconds: number;
  /** 정답/오답 카운트. */
  correctCount: number;
  wrongCount: number;
  /** 현재 연속 정답 수. 오답 시 0으로 돌아갑니다. */
  combo: number;
  /** 판정 진행 중에 입력을 막기 위한 잠금 상태. */
  locked: boolean;
  /** 마지막 피드백 이벤트. */
  lastFeedback: FeedbackEvent | null;
  /** 클리어 시 결과 시간(초, 실수). 종료 전에는 null. */
  resultSeconds: number | null;
  /** 이번 게임 덱을 만든 시드. 도전장 공유에 사용합니다. 시작 전에는 null. */
  deckSeed: number | null;
}

export interface GameApi extends GameSnapshot {
  /** 큐를 준비하고 카드 뒷면 상태로 대기합니다. */
  start: () => void;
  /** 준비된 첫 라운드를 열고 게임을 시작합니다. */
  reveal: () => void;
  /** 사용자가 내 카드의 한 심볼을 탭했을 때 호출합니다. */
  tap: (
    symbol: string,
    options?: { origin?: { x: number; y: number } },
  ) => void;
  /** 결과 화면에서 다시 시작합니다. */
  retry: () => void;
}

export interface GameOptions {
  /** 개발 세션에서만 기본 10 라운드를 더 짧게 줄일 수 있습니다. */
  totalCards?: number;
  /**
   * 게임 시작마다 덱 시드를 결정하는 함수입니다.
   * 데일리/도전장 모드는 고정 시드를, 클래식은 생략(매판 무작위)합니다.
   */
  seedFactory?: () => number;
}

/**
 * 정답 후 다음 라운드로 넘어가기 전 정답 효과를 보여주는 시간(ms).
 * Unity의 `EffectMatch` 코루틴이 약 20프레임 정도 걸렸던 것을 짧게 잡았습니다.
 */
const CORRECT_DELAY_MS = 450;

/**
 * 오답 후 입력을 잠그는 패널티 시간(ms). Unity의 `PANELTY_SECONDS = 1.5`을 그대로 둡니다.
 */
const WRONG_PENALTY_MS = 1500;

function normalizeTotalCards(value: number | undefined): number {
  if (!Number.isInteger(value)) return TOTAL_CARDS;
  return Math.min(TOTAL_CARDS, Math.max(1, value));
}

export function useGame(options: GameOptions = {}): GameApi {
  const configuredTotalCardsRef = useRef(
    normalizeTotalCards(options.totalCards),
  );
  const seedFactoryRef = useRef(options.seedFactory);
  const [status, setStatus] = useState<GameStatus>("idle");
  const [round, setRound] = useState<RoundState | null>(null);
  const [roundIndex, setRoundIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [combo, setCombo] = useState(0);
  const [locked, setLocked] = useState(false);
  const [lastFeedback, setLastFeedback] = useState<FeedbackEvent | null>(null);
  const [resultSeconds, setResultSeconds] = useState<number | null>(null);
  const [deckSeed, setDeckSeed] = useState<number | null>(null);
  const [activeTotalCards, setActiveTotalCards] = useState(
    configuredTotalCardsRef.current,
  );

  // 남은 라운드 수는 정답 수에서 derive합니다.
  // 운영 기본값은 Unity 원본처럼 10에서 시작하고, 테스트 빌드에서는 더 짧게 줄일 수 있습니다.
  const remaining = Math.max(0, activeTotalCards - correctCount);

  const queueRef = useRef<Card[]>([]);
  const timerStartedRef = useRef(false);
  const feedbackIdRef = useRef(0);
  // 콤보는 tap 클로저에서 즉시 읽어야 하므로 state와 함께 ref로도 둡니다.
  const comboRef = useRef(0);
  const roundIndexRef = useRef(0);
  const tickRef = useRef<number | null>(null);
  const pendingTimeoutRef = useRef<number | null>(null);
  const preparedRoundRef = useRef<RoundState | null>(null);
  // 멀티터치 어뷰징 방지용 동기 락. React state는 다음 렌더에야 반영되므로
  // 같은 프레임의 후속 탭이 모두 통과하는 문제를 막기 위해 ref를 진실 소스로 사용합니다.
  const lockedRef = useRef(false);
  // 비동기 클로저에서도 최신 status/round를 참조하기 위해 보조 ref를 둡니다.
  const statusRef = useRef<GameStatus>("idle");
  const roundRef = useRef<RoundState | null>(null);
  statusRef.current = status;
  roundRef.current = round;

  useEffect(() => {
    configuredTotalCardsRef.current = normalizeTotalCards(options.totalCards);
  }, [options.totalCards]);

  useEffect(() => {
    seedFactoryRef.current = options.seedFactory;
  }, [options.seedFactory]);

  const stopTicking = useCallback(() => {
    if (tickRef.current !== null) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  const startTickingIfNeeded = useCallback(() => {
    if (tickRef.current !== null) return;
    const startedAt = performance.now();
    let baseSeconds = 0;
    setElapsedSeconds((current) => {
      baseSeconds = current;
      return current;
    });
    tickRef.current = window.setInterval(() => {
      const next = baseSeconds + (performance.now() - startedAt) / 1000;
      setElapsedSeconds(next);
    }, 100);
  }, []);

  const cancelPendingFollowUp = useCallback(() => {
    if (pendingTimeoutRef.current !== null) {
      window.clearTimeout(pendingTimeoutRef.current);
      pendingTimeoutRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    cancelPendingFollowUp();
    stopTicking();

    const totalCards = configuredTotalCardsRef.current;
    // 시드를 항상 기록해 둬서 클래식 모드도 게임 후 도전장으로 공유할 수 있게 합니다.
    const seed = (seedFactoryRef.current?.() ?? randomSeed()) >>> 0;
    const deck = createDeck({
      prime: PRIME,
      symbolsPerCard: SYMBOLS_PER_CARD,
      maxCards: totalCards,
      rng: mulberry32(seed),
    });
    queueRef.current = [...deck];
    timerStartedRef.current = false;
    lockedRef.current = false;
    comboRef.current = 0;
    roundIndexRef.current = 0;

    const firstRound = takeNextRound(queueRef.current, null);
    preparedRoundRef.current = firstRound;
    roundRef.current = null;
    statusRef.current = firstRound === null ? "idle" : "ready";

    setRound(null);
    setRoundIndex(0);
    setActiveTotalCards(totalCards);
    setElapsedSeconds(0);
    setCorrectCount(0);
    setWrongCount(0);
    setCombo(0);
    setLocked(false);
    setLastFeedback(null);
    setResultSeconds(null);
    setDeckSeed(seed);
    setStatus(firstRound === null ? "idle" : "ready");
  }, [cancelPendingFollowUp, stopTicking]);

  const reveal = useCallback(() => {
    if (statusRef.current !== "ready") return;
    const firstRound = preparedRoundRef.current;
    if (firstRound === null) return;

    preparedRoundRef.current = null;
    roundRef.current = firstRound;
    statusRef.current = "playing";
    setRound(firstRound);
    setStatus("playing");

    if (!timerStartedRef.current) {
      timerStartedRef.current = true;
      startTickingIfNeeded();
    }
  }, [startTickingIfNeeded]);

  const finish = useCallback(
    (seconds: number) => {
      stopTicking();
      cancelPendingFollowUp();
      lockedRef.current = false;
      setStatus("finished");
      setLocked(false);
      setResultSeconds(seconds);
    },
    [cancelPendingFollowUp, stopTicking],
  );

  const tap = useCallback<GameApi["tap"]>(
    (symbol, options) => {
      // 동기 ref로 락을 검사해 같은 프레임의 멀티터치/연타를 한 번만 처리합니다.
      if (lockedRef.current) return;
      const currentStatus = statusRef.current;
      const currentRound = roundRef.current;
      if (currentStatus !== "playing" || currentRound === null) return;

      lockedRef.current = true;
      setLocked(true);

      const isCorrect = symbol === currentRound.hint;
      const nextCombo = isCorrect ? comboRef.current + 1 : 0;
      comboRef.current = nextCombo;
      setCombo(nextCombo);

      const id = ++feedbackIdRef.current;
      setLastFeedback({
        id,
        kind: isCorrect ? "correct" : "wrong",
        origin: options?.origin,
        combo: nextCombo,
      });

      if (isCorrect) {
        setCorrectCount((c) => c + 1);
        if (!timerStartedRef.current) {
          timerStartedRef.current = true;
          startTickingIfNeeded();
        }

        pendingTimeoutRef.current = window.setTimeout(() => {
          pendingTimeoutRef.current = null;
          const previousOpponent = currentRound.opponent;
          const next = takeNextRound(queueRef.current, previousOpponent);
          if (next === null) {
            // 다음 카드가 없으면 게임 종료. 마지막 누적 시간을 결과로 사용합니다.
            setElapsedSeconds((current) => {
              finish(current);
              return current;
            });
            return;
          }
          roundIndexRef.current += 1;
          setRoundIndex(roundIndexRef.current);
          setRound(next);
          lockedRef.current = false;
          setLocked(false);
        }, CORRECT_DELAY_MS);
      } else {
        setWrongCount((c) => c + 1);
        pendingTimeoutRef.current = window.setTimeout(() => {
          pendingTimeoutRef.current = null;
          lockedRef.current = false;
          setLocked(false);
        }, WRONG_PENALTY_MS);
      }
    },
    [finish, startTickingIfNeeded],
  );

  const retry = useCallback(() => {
    start();
  }, [start]);

  // 컴포넌트 언마운트 시 타이머/타임아웃을 깔끔히 정리합니다.
  useEffect(() => {
    return () => {
      stopTicking();
      cancelPendingFollowUp();
      lockedRef.current = false;
    };
  }, [cancelPendingFollowUp, stopTicking]);

  return {
    status,
    remaining,
    totalCards: activeTotalCards,
    round,
    roundIndex,
    elapsedSeconds,
    correctCount,
    wrongCount,
    combo,
    locked,
    lastFeedback,
    resultSeconds,
    deckSeed,
    start,
    reveal,
    tap,
    retry,
  };
}
