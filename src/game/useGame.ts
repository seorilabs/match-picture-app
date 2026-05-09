import { useCallback, useEffect, useRef, useState } from "react";

import { type Card, createDeck } from "./deck";
import {
  PRIME,
  SYMBOLS_PER_CARD,
  TOTAL_CARDS,
  type RoundState,
  takeNextRound,
} from "./rules";

export type GameStatus = "idle" | "playing" | "finished";

export interface FeedbackEvent {
  /** 피드백 식별자입니다. 같은 키가 두 번 들어와도 React가 갱신을 인지하도록 ID를 부여합니다. */
  id: number;
  kind: "correct" | "wrong";
  /** 화면에 잠깐 띄우는 기준 좌표(없으면 기본 위치 사용). */
  origin?: { x: number; y: number };
}

export interface GameSnapshot {
  status: GameStatus;
  /** 큐의 잔여 카드 수입니다. UI에서 남은 라운드 수를 보여주는 용도로 사용합니다. */
  remaining: number;
  /** 현재 라운드 정보. 시작 전 또는 종료 후에는 null. */
  round: RoundState | null;
  /** 게임 시작 후 누적된 초 단위 시간 (실수). */
  elapsedSeconds: number;
  /** 정답/오답 카운트. */
  correctCount: number;
  wrongCount: number;
  /** 판정 진행 중에 입력을 막기 위한 잠금 상태. */
  locked: boolean;
  /** 마지막 피드백 이벤트. */
  lastFeedback: FeedbackEvent | null;
  /** 클리어 시 결과 시간(초). 종료 전에는 null. */
  resultSeconds: number | null;
}

export interface GameApi extends GameSnapshot {
  start: () => void;
  /** 사용자가 내 카드의 한 심볼을 탭했을 때 호출합니다. */
  tap: (
    symbol: string,
    options?: { origin?: { x: number; y: number } },
  ) => void;
  /** 결과 화면에서 다시 시작합니다. */
  retry: () => void;
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

export function useGame(): GameApi {
  const [status, setStatus] = useState<GameStatus>("idle");
  const [round, setRound] = useState<RoundState | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [locked, setLocked] = useState(false);
  const [lastFeedback, setLastFeedback] = useState<FeedbackEvent | null>(null);
  const [resultSeconds, setResultSeconds] = useState<number | null>(null);

  const queueRef = useRef<Card[]>([]);
  const timerStartedRef = useRef(false);
  const feedbackIdRef = useRef(0);
  const tickRef = useRef<number | null>(null);
  const pendingTimeoutRef = useRef<number | null>(null);

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

    const deck = createDeck({
      prime: PRIME,
      symbolsPerCard: SYMBOLS_PER_CARD,
      maxCards: TOTAL_CARDS,
    });
    queueRef.current = [...deck];
    timerStartedRef.current = false;

    const firstRound = takeNextRound(queueRef.current, null);
    setRound(firstRound);
    setRemaining(queueRef.current.length);
    setElapsedSeconds(0);
    setCorrectCount(0);
    setWrongCount(0);
    setLocked(false);
    setLastFeedback(null);
    setResultSeconds(null);
    setStatus(firstRound ? "playing" : "idle");
  }, [cancelPendingFollowUp, stopTicking]);

  const finish = useCallback(
    (seconds: number) => {
      stopTicking();
      cancelPendingFollowUp();
      setStatus("finished");
      setRound(null);
      setLocked(false);
      setResultSeconds(Math.floor(seconds));
    },
    [cancelPendingFollowUp, stopTicking],
  );

  const tap = useCallback<GameApi["tap"]>(
    (symbol, options) => {
      if (status !== "playing" || round === null || locked) return;

      const isCorrect = symbol === round.hint;
      const id = ++feedbackIdRef.current;
      setLastFeedback({
        id,
        kind: isCorrect ? "correct" : "wrong",
        origin: options?.origin,
      });

      if (isCorrect) {
        setCorrectCount((c) => c + 1);
        setLocked(true);
        if (!timerStartedRef.current) {
          timerStartedRef.current = true;
          startTickingIfNeeded();
        }

        pendingTimeoutRef.current = window.setTimeout(() => {
          pendingTimeoutRef.current = null;
          const previousOpponent = round.opponent;
          const next = takeNextRound(queueRef.current, previousOpponent);
          setRemaining(queueRef.current.length);
          if (next === null) {
            // 다음 카드가 없으면 게임 종료. 마지막 누적 시간을 결과로 사용합니다.
            setElapsedSeconds((current) => {
              finish(current);
              return current;
            });
            return;
          }
          setRound(next);
          setLocked(false);
        }, CORRECT_DELAY_MS);
      } else {
        setWrongCount((c) => c + 1);
        setLocked(true);
        pendingTimeoutRef.current = window.setTimeout(() => {
          pendingTimeoutRef.current = null;
          setLocked(false);
        }, WRONG_PENALTY_MS);
      }
    },
    [finish, locked, round, startTickingIfNeeded, status],
  );

  const retry = useCallback(() => {
    start();
  }, [start]);

  // 컴포넌트 언마운트 시 타이머/타임아웃을 깔끔히 정리합니다.
  useEffect(() => {
    return () => {
      stopTicking();
      cancelPendingFollowUp();
    };
  }, [cancelPendingFollowUp, stopTicking]);

  return {
    status,
    remaining,
    round,
    elapsedSeconds,
    correctCount,
    wrongCount,
    locked,
    lastFeedback,
    resultSeconds,
    start,
    tap,
    retry,
  };
}
