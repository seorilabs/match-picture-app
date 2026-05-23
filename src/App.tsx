import { useCallback, useEffect, useRef, useState } from "react";

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
import { ResultModal } from "./components/ResultModal";
import { TutorialModal } from "./components/TutorialModal";
import { useGame } from "./game/useGame";
import { readItem, writeItem } from "./ait/storage";
import { useScreenAwake } from "./ait/awake";
import { requestReviewIfSupported } from "./ait/review";
import {
  clearTimeToLeaderboardScore,
  openLeaderboard,
  submitClearTime,
} from "./ait/leaderboard";
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
  const {
    status,
    remaining,
    round,
    elapsedSeconds,
    locked,
    lastFeedback,
    resultSeconds,
    start: startGame,
    reveal: revealGame,
    tap,
    retry: retryGame,
  } = useGame({ totalCards: debugTotalCards ?? undefined });

  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [tutorialResolved, setTutorialResolved] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false);
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

  // 최초 진입 시 튜토리얼 노출 여부를 결정합니다. Apps in Toss Storage 우선, 없으면 localStorage.
  // useGame이 매 렌더 새 객체를 반환하므로 통째로 deps에 넣으면 무한 루프로 프리징됩니다.
  // useGame 내부의 start callback은 안정된 reference이므로 그것만 deps로 잡습니다.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [flag, savedSoundEnabled] = await Promise.all([
        readItem(TUTORIAL_KEY),
        readItem(SOUND_KEY),
      ]);
      if (cancelled) return;
      if (savedSoundEnabled === "0") setSoundEnabled(false);
      if (flag) {
        setTutorialOpen(false);
        setTutorialResolved(true);
        startGame();
      } else {
        setTutorialOpen(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [startGame]);

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
      lastSubmittedSecondsRef.current = null;
    }
  }, [status]);

  // 클리어 시점에 리더보드 제출 + 리뷰 요청을 시도합니다. 모두 조용한 실패가 기본이라 게임 흐름을 막지 않습니다.
  useEffect(() => {
    if (status !== "finished" || resultSeconds === null) return;
    if (
      launchConfig.leaderboardEnabled &&
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
    startGame();
  }, [soundEnabled, startGame]);

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
      if (soundEnabled) {
        playEffectSound(symbol === round.hint ? "correct" : "wrong");
      }
      tap(symbol, { origin });
    },
    [locked, round, soundEnabled, status, tap],
  );

  return (
    <div className="game-shell">
      <Hud
        remaining={remaining}
        elapsedSeconds={elapsedSeconds}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
      />

      <main className="game-main">
        <section className="card-section opponent-section" aria-label="상대 카드">
          {round ? (
            <CardView
              card={round.opponent}
              variant="opponent"
              hint={round.hint}
              clickable={false}
              onPress={() => undefined}
            />
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
            <CardView
              card={round.mine}
              variant="mine"
              hint={round.hint}
              clickable={!locked && status === "playing"}
              onPress={handleMinePress}
            />
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
        onRetry={handleRetry}
        leaderboardEnabled={launchConfig.leaderboardEnabled}
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
