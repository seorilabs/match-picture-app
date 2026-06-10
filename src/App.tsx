import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import "./App.css";

import {
  playEffectSound,
  preloadEffectSounds,
  stopEffectSounds,
} from "./audio/effects";
import { CardView } from "./components/CardView";
import { ExitConfirmModal } from "./components/ExitConfirmModal";
import { Feedback } from "./components/Feedback";
import { Hud } from "./components/Hud";
import { ResultModal, type ShareStatus } from "./components/ResultModal";
import { TutorialModal } from "./components/TutorialModal";
import {
  CLASSIC_BEST_KEY,
  bestRecordKey,
  dailyBestKey,
  isNewBest,
  parseBestSeconds,
} from "./game/bestRecord";
import {
  type GameMode,
  formatDailyLabel,
  getChallengeParamsFromLocation,
  getDailySeed,
  getKstDateString,
} from "./game/mode";
import { preloadSymbolImages } from "./game/preloadSymbols";
import { useGame } from "./game/useGame";
import { readItem, writeItem } from "./ait/storage";
import { useScreenAwake } from "./ait/awake";
import { triggerHaptic } from "./ait/haptics";
import { requestReviewIfSupported } from "./ait/review";
import {
  clearTimeToLeaderboardScore,
  openLeaderboard,
  submitClearTime,
} from "./ait/leaderboard";
import { shareChallenge } from "./ait/share";
import { useInterstitialAd } from "./ait/ads";
import { closeMiniApp, useDisableIosSwipeBack } from "./ait/navigation";
import { useHiddenCallback } from "./ait/visibility";
import {
  getDefaultLaunchConfig,
  loadCachedLaunchConfig,
  loadLaunchConfig,
} from "./ait/launchConfig";
import { getDebugSessionTotalCards } from "./debug/sessionConfig";

const TUTORIAL_KEY = "match-picture/has-played";
const SOUND_KEY = "match-picture/sound-enabled";

function App() {
  const [launchConfig, setLaunchConfig] = useState(getDefaultLaunchConfig);
  const [debugTotalCards] = useState(getDebugSessionTotalCards);
  // 도전장 링크로 진입했는지는 첫 렌더에 한 번만 판정합니다.
  const [challengeParams] = useState(getChallengeParamsFromLocation);
  const [dailyDateString] = useState(() => getKstDateString());
  const [mode, setMode] = useState<GameMode>(
    challengeParams !== null ? "challenge" : "classic",
  );

  // 데일리/도전장은 고정 시드 팩토리를 쓰고, 클래식은 useGame이 매판 무작위 시드를 만듭니다.
  const gameSeedFactory = useMemo(() => {
    if (mode === "daily") {
      return () => getDailySeed(dailyDateString);
    }
    if (mode === "challenge" && challengeParams !== null) {
      const { seed } = challengeParams;
      return () => seed;
    }
    return undefined;
  }, [challengeParams, dailyDateString, mode]);

  const {
    status,
    remaining,
    totalCards,
    round,
    roundIndex,
    elapsedSeconds,
    correctCount,
    locked,
    lastFeedback,
    resultSeconds,
    deckSeed,
    start: startGame,
    reveal: revealGame,
    tap,
    retry: retryGame,
  } = useGame({
    totalCards: debugTotalCards ?? undefined,
    seedFactory: gameSeedFactory,
  });

  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [tutorialResolved, setTutorialResolved] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false);
  const [classicBest, setClassicBest] = useState<number | null>(null);
  const [dailyBest, setDailyBest] = useState<number | null>(null);
  const [resultBest, setResultBest] = useState<{
    previous: number | null;
    isNew: boolean;
  }>({ previous: null, isNew: false });
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

  const { ready: adReady, show: showAd } = useInterstitialAd(
    launchConfig.interstitialAdEnabled,
  );
  // 게임 화면이 살아있는 동안 화면 항상 켜짐.
  useScreenAwake(true);
  useDisableIosSwipeBack(true);
  useHiddenCallback(stopEffectSounds);

  // 한 세션에 리뷰 요청은 한 번만 호출합니다 (정책 보호 + 사용자 경험).
  const reviewRequestedRef = useRef(false);
  const lastSubmittedSecondsRef = useRef<number | null>(null);
  // 클리어 1회당 베스트 기록 갱신/햅틱을 한 번만 처리하기 위한 가드.
  const finishProcessedRef = useRef(false);

  // 최초 진입 시 튜토리얼 노출 여부와 저장된 설정/기록을 읽습니다.
  // Apps in Toss Storage 우선, 없으면 localStorage.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [flag, savedSoundEnabled, savedClassicBest, savedDailyBest] =
        await Promise.all([
          readItem(TUTORIAL_KEY),
          readItem(SOUND_KEY),
          readItem(CLASSIC_BEST_KEY),
          readItem(dailyBestKey(dailyDateString)),
        ]);
      if (cancelled) return;
      if (savedSoundEnabled === "0") setSoundEnabled(false);
      setClassicBest(parseBestSeconds(savedClassicBest));
      setDailyBest(parseBestSeconds(savedDailyBest));
      if (flag) {
        setTutorialOpen(false);
        setTutorialResolved(true);
      } else {
        setTutorialOpen(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dailyDateString]);

  // 튜토리얼이 끝난 뒤, 그리고 모드가 바뀔 때마다 새 게임을 준비합니다.
  // useGame 내부의 seedFactory ref 갱신 effect가 먼저 실행되므로 모드 변경이 안전하게 반영됩니다.
  useEffect(() => {
    if (!tutorialResolved) return;
    startGame();
  }, [mode, startGame, tutorialResolved]);

  // 라운드 전환에서 처음 보는 심볼이 늦게 뜨지 않도록 전체 심볼을 미리 받아둡니다.
  useEffect(() => {
    preloadSymbolImages();
  }, []);

  useEffect(() => {
    let cancelled = false;
    void loadCachedLaunchConfig().then((config) => {
      if (cancelled || config === null) return;
      setLaunchConfig(config);
    });
    void loadLaunchConfig().then((config) => {
      if (cancelled) return;
      setLaunchConfig(config);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (soundEnabled) {
      preloadEffectSounds();
    } else {
      stopEffectSounds();
    }
  }, [soundEnabled]);

  useEffect(() => {
    if (status !== "finished") {
      setLeaderboardStatus("idle");
      setLeaderboardSubmitStatus("idle");
      setLeaderboardMessage(null);
      setShareStatus("idle");
      lastSubmittedSecondsRef.current = null;
      finishProcessedRef.current = false;
    }
  }, [status]);

  // 클리어 시점에 베스트 기록 갱신과 결과 햅틱을 처리합니다.
  useEffect(() => {
    if (status !== "finished" || resultSeconds === null) return;
    if (finishProcessedRef.current) return;
    finishProcessedRef.current = true;

    const previousBest =
      mode === "classic" ? classicBest : mode === "daily" ? dailyBest : null;
    const recordKey = bestRecordKey(mode, dailyDateString);
    const newBest = recordKey !== null && isNewBest(resultSeconds, previousBest);
    setResultBest({ previous: previousBest, isNew: newBest });

    const challengeWon =
      mode === "challenge" &&
      challengeParams?.targetSeconds != null &&
      resultSeconds < challengeParams.targetSeconds;
    triggerHaptic(newBest || challengeWon ? "newBest" : "clear");

    if (newBest && recordKey !== null) {
      if (mode === "classic") setClassicBest(resultSeconds);
      if (mode === "daily") setDailyBest(resultSeconds);
      void writeItem(recordKey, String(resultSeconds));
    }
  }, [
    challengeParams,
    classicBest,
    dailyBest,
    dailyDateString,
    mode,
    resultSeconds,
    status,
  ]);

  // 클리어 시점에 리더보드 제출 + 리뷰 요청을 시도합니다. 모두 조용한 실패가 기본이라 게임 흐름을 막지 않습니다.
  // 도전장 모드는 공유받은 고정 덱이라 글로벌 랭킹에는 제출하지 않습니다.
  useEffect(() => {
    if (status !== "finished" || resultSeconds === null) return;
    if (
      launchConfig.leaderboardEnabled &&
      mode !== "challenge" &&
      lastSubmittedSecondsRef.current !== resultSeconds
    ) {
      lastSubmittedSecondsRef.current = resultSeconds;
      const submittedSeconds = resultSeconds;
      setLeaderboardSubmitStatus("submitting");
      void submitClearTime(resultSeconds).then((submitStatus) => {
        if (lastSubmittedSecondsRef.current !== submittedSeconds) return;
        setLeaderboardSubmitStatus(
          submitStatus === "SUCCESS" ? "submitted" : "failed",
        );
      });
    }
    if (launchConfig.reviewRequestEnabled && !reviewRequestedRef.current) {
      reviewRequestedRef.current = true;
      void requestReviewIfSupported();
    }
  }, [
    launchConfig.leaderboardEnabled,
    launchConfig.reviewRequestEnabled,
    mode,
    resultSeconds,
    status,
  ]);

  const handleToggleSound = useCallback(() => {
    setSoundEnabled((current) => {
      const next = !current;
      void writeItem(SOUND_KEY, next ? "1" : "0");
      if (!next) stopEffectSounds();
      return next;
    });
  }, []);

  const handleTutorialClose = useCallback(() => {
    if (soundEnabled) preloadEffectSounds();
    setTutorialOpen(false);
    setTutorialResolved(true);
    void writeItem(TUTORIAL_KEY, "1");
  }, [soundEnabled]);

  const handleRetry = useCallback(async () => {
    if (soundEnabled) preloadEffectSounds();
    // 광고가 로드되어 있으면 노출 후 게임 시작. 그렇지 않으면 즉시 시작.
    if (adReady) {
      await showAd();
    }
    retryGame();
  }, [adReady, retryGame, showAd, soundEnabled]);

  const handleRevealCards = useCallback(() => {
    if (soundEnabled) preloadEffectSounds();
    revealGame();
  }, [revealGame, soundEnabled]);

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
    });
    setShareStatus(
      result === "SHARED" ? "shared" : result === "COPIED" ? "copied" : "failed",
    );
  }, [deckSeed, resultSeconds]);

  const handleSelectMode = useCallback((next: GameMode) => {
    setMode((current) => (current === next ? current : next));
  }, []);

  const handlePlayClassic = useCallback(() => {
    handleSelectMode("classic");
  }, [handleSelectMode]);

  const handleExit = useCallback(() => {
    setExitConfirmOpen(true);
  }, []);

  const handleCancelExit = useCallback(() => {
    setExitConfirmOpen(false);
  }, []);

  const handleConfirmExit = useCallback(() => {
    setExitConfirmOpen(false);
    void closeMiniApp();
  }, []);

  const handleMinePress = useCallback(
    (symbol: string, origin: { x: number; y: number }) => {
      if (!round || locked || status !== "playing") return;
      const correct = symbol === round.hint;
      if (soundEnabled) {
        playEffectSound(correct ? "correct" : "wrong");
      }
      triggerHaptic(correct ? "correct" : "wrong");
      tap(symbol, { origin });
    },
    [locked, round, soundEnabled, status, tap],
  );

  // 후반으로 갈수록 심볼 위치가 기본 배치에서 멀어지도록 진행률을 전달합니다.
  const difficultyProgress = totalCards > 0 ? correctCount / totalCards : 0;

  return (
    <div className="game-shell">
      <Hud
        remaining={remaining}
        elapsedSeconds={elapsedSeconds}
        soundEnabled={soundEnabled}
        leaderboardEnabled={launchConfig.leaderboardEnabled}
        leaderboardStatus={leaderboardStatus}
        leaderboardMessage={leaderboardMessage}
        onToggleSound={handleToggleSound}
        onOpenLeaderboard={handleOpenLeaderboard}
      />

      {status === "ready" ? (
        <div className="mode-bar" role="tablist" aria-label="게임 모드">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "classic"}
            className={`mode-chip${mode === "classic" ? " is-active" : ""}`}
            onClick={() => handleSelectMode("classic")}
          >
            클래식
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "daily"}
            className={`mode-chip${mode === "daily" ? " is-active" : ""}`}
            onClick={() => handleSelectMode("daily")}
          >
            오늘의 도전 {formatDailyLabel(dailyDateString)}
            {dailyBest !== null ? " ✓" : ""}
          </button>
          {challengeParams !== null ? (
            <button
              type="button"
              role="tab"
              aria-selected={mode === "challenge"}
              className={`mode-chip${mode === "challenge" ? " is-active" : ""}`}
              onClick={() => handleSelectMode("challenge")}
            >
              도전장
            </button>
          ) : null}
        </div>
      ) : null}

      <main className="game-main">
        <section className="card-section opponent-section" aria-label="상대 카드">
          {round ? (
            <div
              key={`opponent-${roundIndex}`}
              className="card-anim card-anim-deal"
            >
              <CardView
                card={round.opponent}
                variant="opponent"
                hint={round.hint}
                clickable={false}
                progress={difficultyProgress}
                onPress={() => undefined}
              />
            </div>
          ) : status === "ready" ? (
            <div className="card-placeholder card-back" aria-hidden="true" />
          ) : (
            <div className="card-placeholder" aria-hidden="true" />
          )}
        </section>

        <section
          className={`card-section mine-section${locked ? " is-locked" : ""}`}
          aria-label="내 카드"
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
                hint={round.hint}
                clickable={!locked && status === "playing"}
                progress={difficultyProgress}
                onPress={handleMinePress}
              />
            </div>
          ) : status === "ready" ? (
            <button
              type="button"
              className="card-placeholder card-back ready-card-button"
              onClick={handleRevealCards}
              aria-label="카드 열고 게임 시작"
            >
              <span className="ready-card-label">OPEN</span>
              <span className="ready-card-subtitle">카드 열기</span>
            </button>
          ) : (
            <div className="card-placeholder" aria-hidden="true" />
          )}
        </section>
      </main>

      <Feedback event={lastFeedback} />

      <TutorialModal open={tutorialOpen} onClose={handleTutorialClose} />

      <ResultModal
        open={tutorialResolved && status === "finished" && !exitConfirmOpen}
        seconds={resultSeconds}
        mode={mode}
        previousBestSeconds={resultBest.previous}
        isNewBest={resultBest.isNew}
        challengeTargetSeconds={
          mode === "challenge" ? (challengeParams?.targetSeconds ?? null) : null
        }
        onRetry={handleRetry}
        shareStatus={shareStatus}
        onShare={handleShare}
        onPlayClassic={handlePlayClassic}
        leaderboardEnabled={launchConfig.leaderboardEnabled && mode !== "challenge"}
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

export default App;
