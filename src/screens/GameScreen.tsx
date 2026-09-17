import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  playComboSound,
  playEffectSound,
  preloadEffectSounds,
  startBgm,
  stopBgm,
  stopEffectSounds,
} from "../audio/effects";
import { CardView } from "../components/CardView";
import { ExitConfirmModal } from "../components/ExitConfirmModal";
import { Feedback } from "../components/Feedback";
import { Hud } from "../components/Hud";
import { ResultModal, type ShareStatus } from "../components/ResultModal";
import { TutorialModal } from "../components/TutorialModal";
import {
  CLASSIC_BEST_KEY,
  bestRecordKey,
  dailyBestKey,
  dailyLateClearKey,
  dailySubmittedKey,
  isNewBest,
  parseBestSeconds,
} from "../game/bestRecord";
import {
  DIFFICULTIES,
  effectiveDifficulty,
  getDifficulty,
  type DifficultyId,
} from "../game/difficulty";
import {
  type ChallengeParams,
  type GameMode,
  formatDailyLabel,
  getDailySeed,
} from "../game/mode";
import {
  POWER_UPS,
  planPowerUpUse,
  type PowerUpFailureReason,
  type PowerUpId,
} from "../game/powerUps";
import { getStage, nextStageId, stageSeed } from "../game/stages";
import { decideSubmission, canUpdateBestRecord } from "../game/submission";
import { createGameClearEventPayload } from "../game/clearEvent";
import {
  isPackPreloaded,
  waitForPackReady,
} from "../game/preloadSymbols";
import { useGame } from "../game/useGame";
import { readItem, writeItem } from "../ait/storage";
import { useScreenAwake } from "../ait/awake";
import { requestReviewIfSupported } from "../ait/review";
import {
  clearTimeToLeaderboardScore,
  openLeaderboard,
  submitClearTime,
} from "../leaderboard";
import { shareChallenge } from "../ait/share";
import { useInterstitialAd } from "../ait/ads";
import {
  getInterstitialAdPolicyState,
  recordCompletedGame,
  setInterstitialAdPolicyState,
  showInterstitialAdIfAllowed,
} from "../ait/adPolicy";
import { useDisableIosSwipeBack } from "../ait/navigation";
import { useHiddenCallback } from "../ait/visibility";
import { useBackHandler } from "../native/backButton";
import { LAUNCH_CONFIG } from "../ait/launchConfig";
import { getDebugSessionTotalCards } from "../debug/sessionConfig";
import { useProfile } from "../state/profileContext";
import { useSettings } from "../state/settingsContext";
import { computeAwardedComboBonus } from "../state/profile";
import { useI18n } from "../i18n/i18nContext";
import { trackEvent } from "../firebase/analytics";
import {
  trackEarnCurrency,
  trackLevelEnd,
  trackLevelStart,
  trackPostScore,
  trackShareResult,
  trackSpendCurrency,
  trackTutorialBegin,
  trackTutorialComplete,
} from "../firebase/gameEvents";

const TUTORIAL_KEY = "match-picture/has-played";

export interface GameScreenProps {
  /** 홈에서 진입할 때 시작 모드. */
  initialMode?: GameMode;
  /** 앱 시작 시 한 번만 소비한 도전장 파라미터. */
  challengeParams?: ChallengeParams | null;
  /** 스테이지 모드로 진입할 때의 스테이지 번호. */
  stageId?: number | null;
  /** 지난 데일리 아카이브로 진입할 때의 날짜(YYYY-MM-DD). */
  archiveDate?: string | null;
  /** 게임에서 나가기(홈 탭으로 복귀). */
  onExitToHome: () => void;
}

export function GameScreen({
  initialMode = "classic",
  challengeParams = null,
  stageId: initialStageId = null,
  archiveDate = null,
  onExitToHome,
}: GameScreenProps) {
  const {
    profile,
    today,
    equippedPack: symbolPack,
    awardClearCoins,
    addCoins,
    spendCoins,
    setDifficulty,
    recordGameClear,
    recordStageClear,
  } = useProfile();
  const { soundEnabled, toggleSound, haptic } = useSettings();
  const { t } = useI18n();

  const [debugTotalCards] = useState(getDebugSessionTotalCards);
  const [mode, setMode] = useState<GameMode>(initialMode);
  const [stageId, setStageId] = useState<number | null>(initialStageId);
  // 아카이브로 들어온 판은 그 날짜를 고정하고, 그 외에는 오늘 날짜를 따라간다.
  const [dailyDateString, setDailyDateString] = useState(
    () => archiveDate ?? today,
  );

  const stage = stageId === null ? null : getStage(stageId);
  const difficulty =
    mode === "stage" && stage !== null
      ? getDifficulty(stage.difficulty)
      : effectiveDifficulty(mode, profile.difficulty);
  const configuredTotalCards =
    mode === "stage" && stage !== null ? stage.totalCards : difficulty.totalCards;
  const archivedDaily = mode === "daily" && dailyDateString !== today;

  // 데일리/도전장/스테이지는 고정 시드 팩토리를 쓰고, 클래식은 매판 무작위 시드를 만듭니다.
  const gameSeedFactory = useMemo(() => {
    if (mode === "daily") {
      return () => getDailySeed(dailyDateString);
    }
    if (mode === "challenge" && challengeParams !== null) {
      const { seed } = challengeParams;
      return () => seed;
    }
    if (mode === "stage" && stageId !== null) {
      return () => stageSeed(stageId);
    }
    return undefined;
  }, [challengeParams, dailyDateString, mode, stageId]);

  const {
    status,
    remaining,
    totalCards,
    round,
    roundIndex,
    elapsedSeconds,
    correctCount,
    wrongCount,
    combo,
    maxCombo,
    locked,
    lockKind,
    penaltyDurationMs,
    paused,
    lastFeedback,
    resultSeconds,
    deckSeed,
    roundResults,
    usedPowerUps,
    powerUpUseCount,
    powerUpHintActive,
    eliminatedSymbols,
    start: startGame,
    reveal: revealGame,
    tap,
    applyPowerUpEffect,
    pause: pauseGame,
    resume: resumeGame,
    retry: retryGame,
  } = useGame({
    totalCards: debugTotalCards ?? configuredTotalCards,
    prime: difficulty.prime,
    seedFactory: gameSeedFactory,
  });

  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [tutorialResolved, setTutorialResolved] = useState(false);
  const [assetsReady, setAssetsReady] = useState(() =>
    isPackPreloaded(symbolPack),
  );
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false);
  const [classicBest, setClassicBest] = useState<number | null>(null);
  const [dailyBest, setDailyBest] = useState<number | null>(null);
  const [dailySubmitted, setDailySubmitted] = useState(false);
  const [resultBest, setResultBest] = useState<{
    previous: number | null;
    isNew: boolean;
  }>({ previous: null, isNew: false });
  const [earnedCoins, setEarnedCoins] = useState<number | null>(null);
  const [comboBonusCoins, setComboBonusCoins] = useState(0);
  const [earnedDroplets, setEarnedDroplets] = useState(0);
  const [stageStars, setStageStars] = useState(0);
  const [submissionReason, setSubmissionReason] = useState<
    ReturnType<typeof decideSubmission>["reason"]
  >(null);
  const [shareStatus, setShareStatus] = useState<ShareStatus>("idle");
  const [leaderboardStatus, setLeaderboardStatus] = useState<
    "idle" | "opening" | "failed"
  >("idle");
  const [leaderboardSubmitStatus, setLeaderboardSubmitStatus] = useState<
    "idle" | "submitting" | "submitted" | "failed"
  >("idle");
  const [leaderboardMessage, setLeaderboardMessage] = useState<string | null>(
    null,
  );
  const [powerUpMessage, setPowerUpMessage] = useState<string | null>(null);
  const [penaltyBump, setPenaltyBump] = useState(0);

  const { ready: adReady, show: showAd } = useInterstitialAd(
    LAUNCH_CONFIG.interstitialAdEnabled,
  );
  // 게임 화면이 살아있는 동안 화면 항상 켜짐.
  useScreenAwake(true);
  useDisableIosSwipeBack(true);

  // 한 세션에 리뷰 요청은 한 번만 호출합니다 (정책 보호 + 사용자 경험).
  const reviewRequestedRef = useRef(false);
  const lastSubmittedSecondsRef = useRef<number | null>(null);
  // 클리어 1회당 베스트 기록/햅틱/코인 지급을 한 번만 처리하기 위한 가드.
  const finishProcessedRef = useRef(false);
  const levelStartTrackedRef = useRef(false);

  // 화면이 가려지면 효과음을 멈추고 진행 중인 판을 일시정지합니다.
  const handleHidden = useCallback(() => {
    stopEffectSounds();
    pauseGame();
  }, [pauseGame]);
  useHiddenCallback(handleHidden);

  // 최초 진입 시 튜토리얼 노출 여부와 저장된 기록을 읽습니다.
  useEffect(() => {
    let cancelled = false;
    void readItem(TUTORIAL_KEY).then((flag) => {
      if (cancelled) return;
      if (flag) {
        setTutorialOpen(false);
        setTutorialResolved(true);
      } else {
        setTutorialOpen(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      readItem(CLASSIC_BEST_KEY),
      readItem(dailyBestKey(dailyDateString)),
      readItem(dailySubmittedKey(dailyDateString)),
    ]).then(([savedClassicBest, savedDailyBest, submitted]) => {
      if (cancelled) return;
      setClassicBest(parseBestSeconds(savedClassicBest));
      setDailyBest(parseBestSeconds(savedDailyBest));
      setDailySubmitted(submitted === "1");
    });
    return () => {
      cancelled = true;
    };
  }, [dailyDateString]);

  // 자정을 넘겨 날짜가 바뀌면 아직 시작하지 않은 판에만 새 날짜를 적용합니다.
  useEffect(() => {
    if (archiveDate !== null) return;
    if (status !== "ready" && status !== "idle") return;
    setDailyDateString((current) => (current === today ? current : today));
  }, [archiveDate, status, today]);

  // 튜토리얼이 끝난 뒤, 그리고 모드/난이도/날짜가 바뀔 때마다 새 게임을 준비합니다.
  useEffect(() => {
    if (!tutorialResolved) return;
    startGame();
  }, [
    dailyDateString,
    difficulty.id,
    mode,
    stageId,
    startGame,
    tutorialResolved,
  ]);

  // 첫 라운드 심볼이 준비되기 전에는 카드를 열 수 없게 해 타이머 인플레이션을 막습니다.
  useEffect(() => {
    let cancelled = false;
    setAssetsReady(isPackPreloaded(symbolPack));
    void waitForPackReady(symbolPack).then(() => {
      if (!cancelled) setAssetsReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [symbolPack]);

  useEffect(() => {
    if (soundEnabled) {
      preloadEffectSounds();
    } else {
      stopEffectSounds();
    }
  }, [soundEnabled]);

  // 배경음악은 실제 플레이 중에만 재생합니다.
  useEffect(() => {
    if (soundEnabled && status === "playing" && !paused) {
      startBgm();
    } else {
      stopBgm();
    }
  }, [paused, soundEnabled, status]);

  useEffect(() => stopBgm, []);

  useEffect(() => {
    if (status !== "finished") {
      setLeaderboardStatus("idle");
      setLeaderboardSubmitStatus("idle");
      setLeaderboardMessage(null);
      setShareStatus("idle");
      setEarnedCoins(null);
      setComboBonusCoins(0);
      setEarnedDroplets(0);
      setStageStars(0);
      setSubmissionReason(null);
      lastSubmittedSecondsRef.current = null;
      finishProcessedRef.current = false;
    }
  }, [status]);

  useEffect(() => {
    setPowerUpMessage(null);
  }, [mode, roundIndex, status]);

  useEffect(() => {
    if (status === "ready") levelStartTrackedRef.current = false;
  }, [status]);

  // 클리어 시점에 베스트 기록 갱신, 결과 연출, 코인/물방울 지급을 처리합니다.
  useEffect(() => {
    if (status !== "finished" || resultSeconds === null) return;
    if (finishProcessedRef.current) return;
    finishProcessedRef.current = true;
    setInterstitialAdPolicyState(
      recordCompletedGame(getInterstitialAdPolicyState()),
    );

    const decision = decideSubmission({
      mode,
      leaderboardEnabled: LAUNCH_CONFIG.leaderboardEnabled,
      powerUpUseCount,
      dailyAlreadySubmitted: dailySubmitted,
      archivedDaily,
    });
    setSubmissionReason(decision.reason);

    const previousBest =
      mode === "classic" ? classicBest : mode === "daily" ? dailyBest : null;
    const recordKey = bestRecordKey(mode, dailyDateString);
    const bestAllowed = canUpdateBestRecord(mode, powerUpUseCount);
    const newBest =
      bestAllowed && recordKey !== null && isNewBest(resultSeconds, previousBest);
    setResultBest({ previous: previousBest, isNew: newBest });

    const challengeWon =
      mode === "challenge" &&
      challengeParams?.targetSeconds != null &&
      resultSeconds < challengeParams.targetSeconds;
    haptic(newBest || challengeWon ? "newBest" : "clear");
    if (soundEnabled) playEffectSound("clear");

    if (newBest && recordKey !== null) {
      if (mode === "classic") setClassicBest(resultSeconds);
      if (mode === "daily") setDailyBest(resultSeconds);
      void writeItem(recordKey, String(resultSeconds));
    }
    // 발행 당일이 아닌 데일리 클리어는 아카이브에서 "사후 클리어"로 구분합니다.
    if (mode === "daily" && archivedDaily) {
      void writeItem(dailyLateClearKey(dailyDateString), "1");
    }

    // 클리어 보상 코인 지급(클리어당 1회) + 결과 화면에 표시.
    const coins = awardClearCoins(
      resultSeconds,
      mode,
      maxCombo,
      difficulty.id,
    );
    setEarnedCoins(coins);
    trackEarnCurrency("game_clear", coins);
    setComboBonusCoins(
      computeAwardedComboBonus(resultSeconds, mode, maxCombo, difficulty.id),
    );
    // 데일리 미션 진행도 + 누적 통계 + 물방울 갱신.
    const droplets = recordGameClear({
      seconds: resultSeconds,
      mode,
      maxCombo,
      wrongCount,
      correctCount,
    });
    setEarnedDroplets(droplets);

    if (mode === "stage" && stageId !== null) {
      const stageResult = recordStageClear(stageId, resultSeconds, wrongCount);
      setStageStars(stageResult.stars);
      trackEarnCurrency("stage_stars", stageResult.coins);
    }

    void trackEvent(
      "game_clear",
      createGameClearEventPayload(mode, resultSeconds, maxCombo, powerUpUseCount),
    );
    trackLevelEnd({
      mode,
      difficulty: difficulty.id,
      seconds: resultSeconds,
      wrongCount,
      maxCombo,
      powerUpUseCount,
    });
  }, [
    archivedDaily,
    awardClearCoins,
    challengeParams,
    classicBest,
    correctCount,
    dailyBest,
    dailyDateString,
    dailySubmitted,
    difficulty.id,
    haptic,
    maxCombo,
    mode,
    powerUpUseCount,
    recordGameClear,
    recordStageClear,
    resultSeconds,
    soundEnabled,
    stageId,
    status,
    wrongCount,
  ]);

  // 클리어 시점에 리더보드 제출 + 리뷰 요청을 시도합니다.
  useEffect(() => {
    if (status !== "finished" || resultSeconds === null) return;
    const decision = decideSubmission({
      mode,
      leaderboardEnabled: LAUNCH_CONFIG.leaderboardEnabled,
      powerUpUseCount,
      dailyAlreadySubmitted: dailySubmitted,
      archivedDaily,
    });
    if (decision.submit && lastSubmittedSecondsRef.current !== resultSeconds) {
      lastSubmittedSecondsRef.current = resultSeconds;
      const submittedSeconds = resultSeconds;
      const submittedDate = dailyDateString;
      const submittedMode = mode;
      setLeaderboardSubmitStatus("submitting");
      void submitClearTime(resultSeconds).then((submitStatus) => {
        if (lastSubmittedSecondsRef.current !== submittedSeconds) return;
        const success = submitStatus === "SUCCESS";
        setLeaderboardSubmitStatus(success ? "submitted" : "failed");
        if (!success) return;
        trackPostScore(
          Number(clearTimeToLeaderboardScore(submittedSeconds)),
          submittedMode,
        );
        if (submittedMode === "daily") {
          setDailySubmitted(true);
          void writeItem(dailySubmittedKey(submittedDate), "1");
        }
      });
    }
    if (LAUNCH_CONFIG.reviewRequestEnabled && !reviewRequestedRef.current) {
      reviewRequestedRef.current = true;
      void requestReviewIfSupported();
    }
  }, [
    archivedDaily,
    dailyDateString,
    dailySubmitted,
    mode,
    powerUpUseCount,
    resultSeconds,
    status,
  ]);

  const handleTutorialClose = useCallback(
    (interactive: boolean) => {
      if (soundEnabled) preloadEffectSounds();
      setTutorialOpen(false);
      setTutorialResolved(true);
      trackTutorialComplete(interactive);
      void writeItem(TUTORIAL_KEY, "1");
    },
    [soundEnabled],
  );

  const handleRetry = useCallback(async () => {
    if (soundEnabled) preloadEffectSounds();
    setInterstitialAdPolicyState(
      await showInterstitialAdIfAllowed({
        ready: adReady,
        state: getInterstitialAdPolicyState(),
        config: {
          minIntervalSeconds: LAUNCH_CONFIG.interstitialMinIntervalSeconds,
          freeGames: LAUNCH_CONFIG.interstitialFreeGames,
        },
        show: showAd,
      }),
    );
    retryGame();
  }, [
    adReady,
    retryGame,
    showAd,
    soundEnabled,
  ]);

  const handleRevealCards = useCallback(() => {
    if (!assetsReady) return;
    if (soundEnabled) preloadEffectSounds();
    if (!levelStartTrackedRef.current) {
      levelStartTrackedRef.current = true;
      trackLevelStart(mode, difficulty.id);
    }
    revealGame();
  }, [assetsReady, difficulty.id, mode, revealGame, soundEnabled]);

  const handleOpenLeaderboard = useCallback(async () => {
    setLeaderboardStatus("opening");
    setLeaderboardMessage(null);
    const result = await openLeaderboard();
    setLeaderboardStatus(result.status === "OPENED" ? "idle" : "failed");
    setLeaderboardMessage(result.status === "OPENED" ? null : result.message);
  }, []);

  const handleShare = useCallback(async () => {
    if (resultSeconds === null || deckSeed === null) return;
    setShareStatus("sharing");
    const result = await shareChallenge({
      seed: deckSeed,
      seconds: resultSeconds,
      dailyDateString: mode === "daily" ? dailyDateString : undefined,
      roundResults: mode === "daily" ? roundResults : undefined,
    });
    trackShareResult(result);
    setShareStatus(
      result === "SHARED"
        ? "shared"
        : result === "COPIED"
          ? "copied"
          : result === "ABORTED"
            ? "idle"
            : "failed",
    );
  }, [dailyDateString, deckSeed, mode, resultSeconds, roundResults]);

  const handleSelectMode = useCallback((next: GameMode) => {
    setStageId(null);
    setMode((current) => (current === next ? current : next));
  }, []);

  const handleSelectDifficulty = useCallback(
    (next: DifficultyId) => {
      setDifficulty(next);
    },
    [setDifficulty],
  );

  const handlePlayClassic = useCallback(() => {
    handleSelectMode("classic");
  }, [handleSelectMode]);

  const handlePlayDaily = useCallback(() => {
    handleSelectMode("daily");
  }, [handleSelectMode]);

  const handleNextStage = useCallback(() => {
    const next = nextStageId(profile.stages);
    setStageId(next);
    setMode("stage");
  }, [profile.stages]);

  const handleExit = useCallback(() => {
    setExitConfirmOpen(true);
  }, []);

  const handleCancelExit = useCallback(() => {
    setExitConfirmOpen(false);
  }, []);

  const handleConfirmExit = useCallback(() => {
    setExitConfirmOpen(false);
    onExitToHome();
  }, [onExitToHome]);

  // Android 하드웨어 뒤로가기: 안쪽 모달 → 결과/진행 화면 순으로 처리합니다.
  useBackHandler(status === "ready" || status === "playing", () => {
    setExitConfirmOpen(true);
    return true;
  });
  useBackHandler(status === "finished", () => {
    onExitToHome();
    return true;
  });
  useBackHandler(exitConfirmOpen, () => {
    setExitConfirmOpen(false);
    return true;
  });
  useBackHandler(tutorialOpen, () => {
    handleTutorialClose(false);
    return true;
  });

  const handleMinePress = useCallback(
    (symbol: string, origin: { x: number; y: number }) => {
      if (paused) return;
      if (locked) {
        // 패널티 중 추가 탭은 "지금은 잠김"을 강조해 알려줍니다.
        if (lockKind === "penalty") setPenaltyBump((count) => count + 1);
        return;
      }
      if (!round || status !== "playing") return;
      const correct = symbol === round.hint;
      if (soundEnabled) {
        playEffectSound(correct ? "correct" : "wrong");
        if (correct) playComboSound(combo + 1);
      }
      haptic(correct ? "correct" : "wrong");
      tap(symbol, { origin });
    },
    [combo, haptic, lockKind, locked, paused, round, soundEnabled, status, tap],
  );

  const powerUpFailureMessage = useCallback(
    (reason: PowerUpFailureReason): string => {
      if (reason === "ranked-mode") return t("powerup.policy.ranked");
      if (reason === "not-enough-coins") return t("powerup.notEnough");
      if (reason === "already-used") return t("powerup.alreadyUsed");
      return t("powerup.unavailable");
    },
    [t],
  );

  const handleUsePowerUp = useCallback(
    (id: PowerUpId) => {
      const plan = planPowerUpUse({
        id,
        coins: profile.coins,
        mode,
        round,
        usedPowerUps,
        eliminatedSymbols,
      });
      if (!plan.ok) {
        setPowerUpMessage(powerUpFailureMessage(plan.reason));
        return;
      }

      const spent = spendCoins(plan.price);
      if (!spent.ok) {
        setPowerUpMessage(t("powerup.notEnough"));
        return;
      }

      if (!applyPowerUpEffect(plan.effect)) {
        addCoins(plan.price);
        setPowerUpMessage(t("powerup.unavailable"));
        return;
      }

      trackSpendCurrency(`powerup_${id}`, plan.price);
      setPowerUpMessage(t(`powerup.success.${id}`));
    },
    [
      addCoins,
      applyPowerUpEffect,
      eliminatedSymbols,
      mode,
      powerUpFailureMessage,
      profile.coins,
      round,
      spendCoins,
      t,
      usedPowerUps,
    ],
  );

  const powerUpsAllowed = mode === "classic" || mode === "stage";
  const powerUpsInteractive = powerUpsAllowed && status === "playing" && !locked;
  const hintUsed = usedPowerUps.includes("hint");
  const eliminateUsed = usedPowerUps.includes("eliminate");
  const defaultPowerUpMessage = !powerUpsAllowed
    ? t("powerup.policy.ranked")
    : status !== "playing"
      ? t("powerup.openFirst")
      : locked
        ? t("powerup.wait")
        : t("powerup.available");

  const penaltyActive = locked && lockKind === "penalty";
  // 후반으로 갈수록 심볼 위치가 기본 배치에서 멀어지도록 진행률을 전달합니다.
  const difficultyProgress = totalCards > 0 ? correctCount / totalCards : 0;
  const hasNextStage =
    mode === "stage" && stageId !== null && getStage(stageId + 1) !== null;

  return (
    <div className="game-shell">
      <Hud
        remaining={remaining}
        elapsedSeconds={elapsedSeconds}
        soundEnabled={soundEnabled}
        leaderboardEnabled={LAUNCH_CONFIG.leaderboardEnabled}
        leaderboardStatus={leaderboardStatus}
        leaderboardMessage={leaderboardMessage}
        onToggleSound={toggleSound}
        onOpenLeaderboard={handleOpenLeaderboard}
        onExit={handleExit}
      />

      {status === "ready" ? (
        <>
          <div className="mode-bar" role="group" aria-label={t("game.modeAria")}>
            <button
              type="button"
              aria-pressed={mode === "classic"}
              className={`mode-chip${mode === "classic" ? " is-active" : ""}`}
              onClick={() => handleSelectMode("classic")}
            >
              {t("game.classic")}
            </button>
            <button
              type="button"
              aria-pressed={mode === "daily"}
              className={`mode-chip${mode === "daily" ? " is-active" : ""}`}
              onClick={() => handleSelectMode("daily")}
            >
              {t("game.daily", { label: formatDailyLabel(dailyDateString) })}
              {dailyBest !== null ? " ✓" : ""}
            </button>
            {stageId !== null ? (
              <button
                type="button"
                aria-pressed={mode === "stage"}
                className={`mode-chip${mode === "stage" ? " is-active" : ""}`}
                onClick={() => setMode("stage")}
              >
                {t("game.stage", { n: stageId })}
              </button>
            ) : null}
            {challengeParams !== null ? (
              <button
                type="button"
                aria-pressed={mode === "challenge"}
                className={`mode-chip${mode === "challenge" ? " is-active" : ""}`}
                onClick={() => setMode("challenge")}
              >
                {t("game.challenge")}
              </button>
            ) : null}
          </div>

          <div
            className="difficulty-bar"
            role="group"
            aria-label={t("difficulty.label")}
          >
            {DIFFICULTIES.map((option) => (
              <button
                key={option.id}
                type="button"
                aria-pressed={difficulty.id === option.id}
                className={`difficulty-chip${
                  difficulty.id === option.id ? " is-active" : ""
                }`}
                disabled={mode !== "classic"}
                onClick={() => handleSelectDifficulty(option.id)}
              >
                {t(`difficulty.${option.id}`)}
              </button>
            ))}
            {mode !== "classic" ? (
              <span className="difficulty-note">
                {mode === "stage" ? "" : t("difficulty.lockedMode")}
              </span>
            ) : null}
          </div>
        </>
      ) : null}

      <main className="game-main">
        <section
          className="card-section opponent-section"
          aria-label={t("game.aria.opponent")}
        >
          {round ? (
            <div
              key={`opponent-${roundIndex}`}
              className="card-anim card-anim-deal"
            >
              <CardView
                card={round.opponent}
                variant="opponent"
                pack={symbolPack}
                hint={round.hint}
                deckSeed={deckSeed}
                mode={mode}
                clickable={false}
                progress={difficultyProgress}
                jitterScale={difficulty.jitterScale}
                onPress={() => undefined}
              />
            </div>
          ) : status === "ready" ? (
            <div className="card-placeholder card-back" aria-hidden="true" />
          ) : (
            <div className="card-placeholder" aria-hidden="true" />
          )}
        </section>

        <section className="power-up-panel" aria-label={t("powerup.groupAria")}>
          <div className="power-up-buttons">
            <button
              type="button"
              className={`power-up-button${
                profile.coins < POWER_UPS.hint.price ? " is-unaffordable" : ""
              }${hintUsed ? " is-used" : ""}`}
              disabled={!powerUpsInteractive || hintUsed}
              onClick={() => handleUsePowerUp("hint")}
            >
              <span className="power-up-icon" aria-hidden="true">
                💡
              </span>
              <span className="power-up-name">{t("powerup.hint")}</span>
              <span className="power-up-cost">
                {hintUsed ? t("powerup.used") : `🪙 ${POWER_UPS.hint.price}`}
              </span>
            </button>
            <button
              type="button"
              className={`power-up-button${
                profile.coins < POWER_UPS.eliminate.price
                  ? " is-unaffordable"
                  : ""
              }${eliminateUsed ? " is-used" : ""}`}
              disabled={!powerUpsInteractive || eliminateUsed}
              onClick={() => handleUsePowerUp("eliminate")}
            >
              <span className="power-up-icon" aria-hidden="true">
                ✂️
              </span>
              <span className="power-up-name">{t("powerup.eliminate")}</span>
              <span className="power-up-cost">
                {eliminateUsed
                  ? t("powerup.used")
                  : `🪙 ${POWER_UPS.eliminate.price}`}
              </span>
            </button>
          </div>
          <p className="power-up-message" role="status" aria-live="polite">
            {powerUpMessage ?? defaultPowerUpMessage}
          </p>
        </section>

        <section
          className={`card-section mine-section${locked ? " is-locked" : ""}${
            penaltyActive ? " is-penalty" : ""
          }`}
          aria-label={t("game.aria.mine")}
        >
          {round ? (
            <div
              key={`mine-${roundIndex}`}
              className={`card-anim ${
                roundIndex === 0 ? "card-anim-deal" : "card-anim-slide"
              }`}
            >
              <CardView
                card={round.mine}
                variant="mine"
                pack={symbolPack}
                hint={round.hint}
                deckSeed={deckSeed}
                mode={mode}
                powerUpHintActive={powerUpHintActive}
                eliminatedSymbols={eliminatedSymbols}
                clickable={!locked && status === "playing"}
                progress={difficultyProgress}
                jitterScale={difficulty.jitterScale}
                onPress={handleMinePress}
              />
            </div>
          ) : status === "ready" ? (
            <button
              type="button"
              className="card-placeholder card-back ready-card-button"
              onClick={handleRevealCards}
              disabled={!assetsReady}
              aria-label={t("game.aria.openCard")}
            >
              <span className="ready-card-label">
                {assetsReady ? t("game.open") : t("game.loading")}
              </span>
              <span className="ready-card-subtitle">{t("game.openSub")}</span>
            </button>
          ) : (
            <div className="card-placeholder" aria-hidden="true" />
          )}

          {penaltyActive ? (
            <div
              className="penalty-overlay"
              key={`penalty-${penaltyBump}`}
              aria-hidden="true"
            >
              <span
                className="penalty-ring"
                style={{ animationDuration: `${penaltyDurationMs}ms` }}
              />
              <span className="penalty-label">{t("game.penalty")}</span>
            </div>
          ) : null}
        </section>
      </main>

      <p className="sr-only" role="status" aria-live="assertive">
        {penaltyActive ? t("game.aria.locked") : t("game.aria.unlocked")}
      </p>

      <Feedback event={lastFeedback} />

      {paused && status === "playing" ? (
        <div className="pause-overlay" role="dialog" aria-modal="true">
          <div className="pause-panel">
            <strong className="pause-title">{t("game.pauseTitle")}</strong>
            <p className="pause-body">{t("game.pauseBody")}</p>
            <button type="button" className="primary-button" onClick={resumeGame}>
              {t("game.resume")}
            </button>
          </div>
        </div>
      ) : null}

      <TutorialModal
        open={tutorialOpen}
        pack={symbolPack}
        onOpen={trackTutorialBegin}
        onClose={handleTutorialClose}
      />

      <ResultModal
        open={tutorialResolved && status === "finished" && !exitConfirmOpen}
        seconds={resultSeconds}
        mode={mode}
        previousBestSeconds={resultBest.previous}
        isNewBest={resultBest.isNew}
        challengeTargetSeconds={
          mode === "challenge" ? (challengeParams?.targetSeconds ?? null) : null
        }
        earnedCoins={earnedCoins}
        maxCombo={maxCombo}
        comboBonusCoins={comboBonusCoins}
        correctCount={correctCount}
        wrongCount={wrongCount}
        earnedDroplets={earnedDroplets}
        submissionBlockReason={submissionReason}
        stageId={mode === "stage" ? stageId : null}
        stageStars={stageStars}
        hasNextStage={hasNextStage}
        onNextStage={handleNextStage}
        dailyClearedToday={dailyBest !== null}
        onPlayDaily={handlePlayDaily}
        onRetry={handleRetry}
        shareStatus={shareStatus}
        onShare={handleShare}
        onPlayClassic={handlePlayClassic}
        leaderboardEnabled={
          LAUNCH_CONFIG.leaderboardEnabled &&
          mode !== "challenge" &&
          mode !== "stage"
        }
        leaderboardScore={
          resultSeconds === null
            ? null
            : clearTimeToLeaderboardScore(resultSeconds)
        }
        leaderboardSubmitStatus={leaderboardSubmitStatus}
        leaderboardStatus={leaderboardStatus}
        leaderboardMessage={leaderboardMessage}
        onOpenLeaderboard={handleOpenLeaderboard}
        onExit={handleExit}
      />

      <ExitConfirmModal
        open={exitConfirmOpen}
        onCancel={handleCancelExit}
        onConfirm={handleConfirmExit}
      />
    </div>
  );
}
