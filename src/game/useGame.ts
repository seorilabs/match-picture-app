import { useCallback, useEffect, useRef, useState } from "react";

import { type Card, createDeck } from "./deck";
import { advanceComboProgress, createInitialComboProgress } from "./combo";
import type { PowerUpEffect, PowerUpId } from "./powerUps";
import { mulberry32, randomSeed } from "./rng";
import {
  PRIME,
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

/** 입력이 잠긴 이유입니다. 정답 전환 대기와 오답 패널티를 화면에서 구분합니다. */
export type LockKind = "correct" | "penalty";

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
  /** 남은 라운드 수입니다. 시작 직후 `totalCards`에서 시작해 정답마다 1씩 줄어듭니다. */
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
  /** 이번 게임에서 달성한 최대 연속 정답 수. */
  maxCombo: number;
  /** 판정 진행 중에 입력을 막기 위한 잠금 상태. */
  locked: boolean;
  /** 잠금 이유(정답 전환 대기/오답 패널티). 잠겨 있지 않으면 null. */
  lockKind: LockKind | null;
  /** 오답 패널티 잠금의 총 길이(ms). 카운트다운 표시에 사용합니다. */
  penaltyDurationMs: number;
  /** 화면이 가려져 자동 일시정지된 상태인지. */
  paused: boolean;
  /** 마지막 피드백 이벤트. */
  lastFeedback: FeedbackEvent | null;
  /** 클리어 시 결과 시간(초, 실수). 종료 전에는 null. */
  resultSeconds: number | null;
  /** 이번 게임 덱을 만든 시드. 도전장 공유와 배치 결정에 사용합니다. 시작 전에는 null. */
  deckSeed: number | null;
  /** 라운드별로 한 번에 맞혔는지(true) 아닌지(false). 공유용 이모지 그리드에 사용합니다. */
  roundResults: readonly boolean[];
  /** 현재 라운드에서 이미 사용한 파워업. 각 파워업은 라운드당 한 번만 허용합니다. */
  usedPowerUps: readonly PowerUpId[];
  /** 이번 게임 전체에서 사용한 파워업 횟수. 기록 제출 정책에 사용합니다. */
  powerUpUseCount: number;
  /** 즉시 힌트 강조가 현재 라운드에 적용됐는지. */
  powerUpHintActive: boolean;
  /** 소거 파워업으로 비활성화한 현재 라운드의 오답 심볼. */
  eliminatedSymbols: readonly string[];
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
  /** 코인 차감이 확인된 파워업 효과를 현재 라운드에 반영합니다. */
  applyPowerUpEffect: (effect: PowerUpEffect) => boolean;
  /** 화면이 가려졌을 때 타이머와 판정 대기를 멈춥니다. */
  pause: () => void;
  /** 일시정지를 해제하고 멈춘 지점부터 이어갑니다. */
  resume: () => void;
  /** 결과 화면에서 다시 시작합니다. */
  retry: () => void;
}

export interface GameOptions {
  /** 한 판의 라운드 수. 난이도/스테이지/디버그 세션이 결정합니다. */
  totalCards?: number;
  /** Dobble 덱 생성 소수. 카드당 심볼 수는 prime + 1이 됩니다. */
  prime?: number;
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
export const WRONG_PENALTY_MS = 1500;

/** 스테이지/어려움 난이도까지 감당할 수 있는 라운드 수 상한입니다. */
export const MAX_TOTAL_CARDS = 30;

function normalizeTotalCards(value: number | undefined): number {
  if (!Number.isInteger(value)) return TOTAL_CARDS;
  return Math.min(MAX_TOTAL_CARDS, Math.max(1, value as number));
}

interface PendingFollowUp {
  kind: LockKind;
  run: () => void;
  remainingMs: number;
  startedAt: number;
}

export function useGame(options: GameOptions = {}): GameApi {
  const configuredTotalCardsRef = useRef(
    normalizeTotalCards(options.totalCards),
  );
  const configuredPrimeRef = useRef(options.prime ?? PRIME);
  const seedFactoryRef = useRef(options.seedFactory);
  const [status, setStatus] = useState<GameStatus>("idle");
  const [round, setRound] = useState<RoundState | null>(null);
  const [roundIndex, setRoundIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [locked, setLocked] = useState(false);
  const [lockKind, setLockKind] = useState<LockKind | null>(null);
  const [paused, setPaused] = useState(false);
  const [lastFeedback, setLastFeedback] = useState<FeedbackEvent | null>(null);
  const [resultSeconds, setResultSeconds] = useState<number | null>(null);
  const [deckSeed, setDeckSeed] = useState<number | null>(null);
  const [roundResults, setRoundResults] = useState<boolean[]>([]);
  const [usedPowerUps, setUsedPowerUps] = useState<PowerUpId[]>([]);
  const [powerUpUseCount, setPowerUpUseCount] = useState(0);
  const [eliminatedSymbols, setEliminatedSymbols] = useState<string[]>([]);
  const [activeTotalCards, setActiveTotalCards] = useState(
    configuredTotalCardsRef.current,
  );

  // 남은 라운드 수는 정답 수에서 derive합니다.
  const remaining = Math.max(0, activeTotalCards - correctCount);

  const queueRef = useRef<Card[]>([]);
  const timerStartedRef = useRef(false);
  const feedbackIdRef = useRef(0);
  // 콤보는 tap 클로저에서 즉시 읽어야 하므로 state와 함께 ref로도 둡니다.
  const comboRef = useRef(0);
  const maxComboRef = useRef(0);
  const roundIndexRef = useRef(0);
  const tickRef = useRef<number | null>(null);
  const pendingTimeoutRef = useRef<number | null>(null);
  const pendingRef = useRef<PendingFollowUp | null>(null);
  const preparedRoundRef = useRef<RoundState | null>(null);
  // 누적 경과 시간의 진실 소스. 일시정지/재개가 이 값을 기준으로 이어집니다.
  const elapsedRef = useRef(0);
  const pausedRef = useRef(false);
  // 현재 라운드에서 오답이 있었는지(공유용 라운드 로그).
  const roundCleanRef = useRef(true);
  // 멀티터치 어뷰징 방지용 동기 락. React state는 다음 렌더에야 반영되므로
  // 같은 프레임의 후속 탭이 모두 통과하는 문제를 막기 위해 ref를 진실 소스로 사용합니다.
  const lockedRef = useRef(false);
  // 비동기 클로저에서도 최신 status/round를 참조하기 위해 보조 ref를 둡니다.
  const statusRef = useRef<GameStatus>("idle");
  const roundRef = useRef<RoundState | null>(null);
  const usedPowerUpsRef = useRef<PowerUpId[]>([]);
  const eliminatedSymbolsRef = useRef<string[]>([]);
  statusRef.current = status;
  roundRef.current = round;
  // seedFactory는 effect가 아니라 렌더 시점에 동기 반영합니다.
  // 모드 변경과 같은 커밋에서 start()가 호출돼도 항상 최신 팩토리를 읽게 하기 위함입니다.
  seedFactoryRef.current = options.seedFactory;

  useEffect(() => {
    configuredTotalCardsRef.current = normalizeTotalCards(options.totalCards);
  }, [options.totalCards]);

  useEffect(() => {
    configuredPrimeRef.current = options.prime ?? PRIME;
  }, [options.prime]);

  const stopTicking = useCallback(() => {
    if (tickRef.current !== null) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  const startTickingIfNeeded = useCallback(() => {
    if (tickRef.current !== null || pausedRef.current) return;
    const startedAt = performance.now();
    const baseSeconds = elapsedRef.current;
    tickRef.current = window.setInterval(() => {
      const next = baseSeconds + (performance.now() - startedAt) / 1000;
      elapsedRef.current = next;
      setElapsedSeconds(next);
    }, 100);
  }, []);

  const cancelPendingFollowUp = useCallback(() => {
    if (pendingTimeoutRef.current !== null) {
      window.clearTimeout(pendingTimeoutRef.current);
      pendingTimeoutRef.current = null;
    }
    pendingRef.current = null;
  }, []);

  const schedulePendingFollowUp = useCallback(
    (kind: LockKind, delayMs: number, run: () => void) => {
      pendingRef.current = {
        kind,
        run,
        remainingMs: delayMs,
        startedAt: performance.now(),
      };
      pendingTimeoutRef.current = window.setTimeout(() => {
        pendingTimeoutRef.current = null;
        pendingRef.current = null;
        run();
      }, delayMs);
    },
    [],
  );

  const resetPowerUpsForRound = useCallback(() => {
    usedPowerUpsRef.current = [];
    eliminatedSymbolsRef.current = [];
    setUsedPowerUps([]);
    setEliminatedSymbols([]);
  }, []);

  const unlock = useCallback(() => {
    lockedRef.current = false;
    setLocked(false);
    setLockKind(null);
  }, []);

  const start = useCallback(() => {
    cancelPendingFollowUp();
    stopTicking();

    const totalCards = configuredTotalCardsRef.current;
    const prime = configuredPrimeRef.current;
    // 시드를 항상 기록해 둬서 클래식 모드도 게임 후 도전장으로 공유할 수 있게 합니다.
    const seed = (seedFactoryRef.current?.() ?? randomSeed()) >>> 0;
    const deck = createDeck({
      prime,
      symbolsPerCard: prime + 1,
      maxCards: totalCards,
      rng: mulberry32(seed),
    });
    queueRef.current = [...deck];
    timerStartedRef.current = false;
    lockedRef.current = false;
    pausedRef.current = false;
    elapsedRef.current = 0;
    roundCleanRef.current = true;
    resetPowerUpsForRound();
    const initialCombo = createInitialComboProgress();
    comboRef.current = initialCombo.combo;
    maxComboRef.current = initialCombo.maxCombo;
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
    setCombo(initialCombo.combo);
    setMaxCombo(initialCombo.maxCombo);
    setLocked(false);
    setLockKind(null);
    setPaused(false);
    setLastFeedback(null);
    setResultSeconds(null);
    setDeckSeed(seed);
    setRoundResults([]);
    setPowerUpUseCount(0);
    setStatus(firstRound === null ? "idle" : "ready");
  }, [cancelPendingFollowUp, resetPowerUpsForRound, stopTicking]);

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
      statusRef.current = "finished";
      setStatus("finished");
      setLocked(false);
      setLockKind(null);
      setPaused(false);
      pausedRef.current = false;
      setResultSeconds(seconds);
    },
    [cancelPendingFollowUp, stopTicking],
  );

  const tap = useCallback<GameApi["tap"]>(
    (symbol, options) => {
      // 동기 ref로 락을 검사해 같은 프레임의 멀티터치/연타를 한 번만 처리합니다.
      if (lockedRef.current || pausedRef.current) return;
      const currentStatus = statusRef.current;
      const currentRound = roundRef.current;
      if (currentStatus !== "playing" || currentRound === null) return;

      const isCorrect = symbol === currentRound.hint;
      lockedRef.current = true;
      setLocked(true);
      setLockKind(isCorrect ? "correct" : "penalty");

      const nextCombo = advanceComboProgress(
        { combo: comboRef.current, maxCombo: maxComboRef.current },
        isCorrect,
      );
      comboRef.current = nextCombo.combo;
      maxComboRef.current = nextCombo.maxCombo;
      setCombo(nextCombo.combo);
      setMaxCombo(nextCombo.maxCombo);

      const id = ++feedbackIdRef.current;
      setLastFeedback({
        id,
        kind: isCorrect ? "correct" : "wrong",
        origin: options?.origin,
        combo: nextCombo.combo,
      });

      if (isCorrect) {
        setCorrectCount((c) => c + 1);
        const roundClean = roundCleanRef.current;
        roundCleanRef.current = true;
        setRoundResults((current) => [...current, roundClean]);
        if (!timerStartedRef.current) {
          timerStartedRef.current = true;
          startTickingIfNeeded();
        }

        schedulePendingFollowUp("correct", CORRECT_DELAY_MS, () => {
          const previousOpponent = currentRound.opponent;
          const next = takeNextRound(queueRef.current, previousOpponent);
          if (next === null) {
            // 다음 카드가 없으면 게임 종료. 마지막 누적 시간을 결과로 사용합니다.
            finish(elapsedRef.current);
            return;
          }
          roundIndexRef.current += 1;
          resetPowerUpsForRound();
          roundRef.current = next;
          setRoundIndex(roundIndexRef.current);
          setRound(next);
          unlock();
        });
      } else {
        roundCleanRef.current = false;
        setWrongCount((c) => c + 1);
        schedulePendingFollowUp("penalty", WRONG_PENALTY_MS, () => {
          unlock();
        });
      }
    },
    [
      finish,
      resetPowerUpsForRound,
      schedulePendingFollowUp,
      startTickingIfNeeded,
      unlock,
    ],
  );

  const applyPowerUpEffect = useCallback<GameApi["applyPowerUpEffect"]>(
    (effect) => {
      const currentRound = roundRef.current;
      if (
        statusRef.current !== "playing" ||
        lockedRef.current ||
        pausedRef.current ||
        currentRound === null ||
        usedPowerUpsRef.current.includes(effect.id)
      ) {
        return false;
      }

      if (effect.id === "eliminate") {
        const validSymbols = effect.eliminatedSymbols.filter(
          (symbol) =>
            symbol !== currentRound.hint &&
            currentRound.mine.includes(symbol) &&
            !eliminatedSymbolsRef.current.includes(symbol),
        );
        if (validSymbols.length === 0) return false;
        eliminatedSymbolsRef.current = [
          ...eliminatedSymbolsRef.current,
          ...validSymbols,
        ];
        setEliminatedSymbols(eliminatedSymbolsRef.current);
      }

      usedPowerUpsRef.current = [...usedPowerUpsRef.current, effect.id];
      setUsedPowerUps(usedPowerUpsRef.current);
      // 게임 단위 사용 횟수는 라운드 전환에서 초기화하지 않습니다(기록 제출 정책).
      setPowerUpUseCount((count) => count + 1);
      return true;
    },
    [],
  );

  const pause = useCallback(() => {
    if (statusRef.current !== "playing" || pausedRef.current) return;
    pausedRef.current = true;
    setPaused(true);
    stopTicking();

    const pending = pendingRef.current;
    if (pending !== null) {
      if (pendingTimeoutRef.current !== null) {
        window.clearTimeout(pendingTimeoutRef.current);
        pendingTimeoutRef.current = null;
      }
      pendingRef.current = {
        ...pending,
        remainingMs: Math.max(
          0,
          pending.remainingMs - (performance.now() - pending.startedAt),
        ),
      };
    }
  }, [stopTicking]);

  const resume = useCallback(() => {
    if (!pausedRef.current) return;
    pausedRef.current = false;
    setPaused(false);

    const pending = pendingRef.current;
    if (pending !== null) {
      pendingRef.current = null;
      schedulePendingFollowUp(pending.kind, pending.remainingMs, pending.run);
    }
    if (statusRef.current === "playing" && timerStartedRef.current) {
      startTickingIfNeeded();
    }
  }, [schedulePendingFollowUp, startTickingIfNeeded]);

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
    maxCombo,
    locked,
    lockKind,
    penaltyDurationMs: WRONG_PENALTY_MS,
    paused,
    lastFeedback,
    resultSeconds,
    deckSeed,
    roundResults,
    usedPowerUps,
    powerUpUseCount,
    powerUpHintActive: usedPowerUps.includes("hint"),
    eliminatedSymbols,
    start,
    reveal,
    tap,
    applyPowerUpEffect,
    pause,
    resume,
    retry,
  };
}
