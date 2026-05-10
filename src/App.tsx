import { useCallback, useEffect, useRef, useState } from "react";

import "./App.css";

import { playEffectSound, preloadEffectSounds } from "./audio/effects";
import { CardView } from "./components/CardView";
import { Feedback } from "./components/Feedback";
import { Hud } from "./components/Hud";
import { ResultModal } from "./components/ResultModal";
import { TutorialModal } from "./components/TutorialModal";
import { TOTAL_CARDS } from "./game/rules";
import { useGame } from "./game/useGame";
import { readItem, writeItem } from "./ait/storage";
import { useScreenAwake } from "./ait/awake";
import { isShareSupported, shareScore } from "./ait/share";
import { requestReviewIfSupported } from "./ait/review";
import { submitClearTime } from "./ait/leaderboard";
import { useInterstitialAd } from "./ait/ads";

const TUTORIAL_KEY = "match-picture/has-played";

function App() {
  const {
    status,
    remaining,
    round,
    elapsedSeconds,
    correctCount,
    wrongCount,
    locked,
    lastFeedback,
    resultSeconds,
    start: startGame,
    reveal: revealFirstRound,
    tap,
    retry: retryGame,
  } = useGame();

  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [tutorialResolved, setTutorialResolved] = useState(false);

  const { ready: adReady, show: showAd } = useInterstitialAd();
  // 게임 화면이 살아있는 동안 화면 항상 켜짐.
  useScreenAwake(true);

  // 한 세션에 리뷰 요청은 한 번만 호출합니다 (정책 보호 + 사용자 경험).
  const reviewRequestedRef = useRef(false);
  const lastSubmittedSecondsRef = useRef<number | null>(null);

  // 최초 진입 시 튜토리얼 노출 여부를 결정합니다. Apps in Toss Storage 우선, 없으면 localStorage.
  // useGame이 매 렌더 새 객체를 반환하므로 통째로 deps에 넣으면 무한 루프로 프리징됩니다.
  // useGame 내부의 start callback은 안정된 reference이므로 그것만 deps로 잡습니다.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const flag = await readItem(TUTORIAL_KEY);
      if (cancelled) return;
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

  // 클리어 시점에 리더보드 제출 + 리뷰 요청을 시도합니다. 모두 조용한 실패가 기본이라 게임 흐름을 막지 않습니다.
  useEffect(() => {
    if (status !== "finished" || resultSeconds === null) return;
    if (lastSubmittedSecondsRef.current !== resultSeconds) {
      lastSubmittedSecondsRef.current = resultSeconds;
      void submitClearTime(resultSeconds);
    }
    if (!reviewRequestedRef.current) {
      reviewRequestedRef.current = true;
      void requestReviewIfSupported();
    }
  }, [resultSeconds, status]);

  const handleTutorialClose = useCallback(() => {
    preloadEffectSounds();
    setTutorialOpen(false);
    setTutorialResolved(true);
    void writeItem(TUTORIAL_KEY, "1");
    startGame();
  }, [startGame]);

  const handleRevealFirstRound = useCallback(() => {
    preloadEffectSounds();
    revealFirstRound();
  }, [revealFirstRound]);

  const handleRetry = useCallback(async () => {
    preloadEffectSounds();
    // 광고가 로드되어 있으면 노출 후 게임 시작. 그렇지 않으면 즉시 시작.
    if (adReady) {
      await showAd();
    }
    retryGame();
  }, [adReady, retryGame, showAd]);

  const handleShare = useCallback(async () => {
    if (resultSeconds === null) return;
    await shareScore(resultSeconds);
  }, [resultSeconds]);

  const handleMinePress = useCallback(
    (symbol: string, origin: { x: number; y: number }) => {
      if (!round || locked || status !== "playing") return;
      playEffectSound(symbol === round.hint ? "correct" : "wrong");
      tap(symbol, { origin });
    },
    [locked, round, status, tap],
  );

  const isReady = status === "ready";

  return (
    <div className="game-shell">
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
          ) : isReady ? (
            <div className="card-back opponent" aria-hidden="true" />
          ) : (
            <div className="card-placeholder" aria-hidden="true" />
          )}
        </section>

        <Hud
          remaining={remaining}
          totalRemaining={TOTAL_CARDS}
          elapsedSeconds={elapsedSeconds}
          correctCount={correctCount}
          wrongCount={wrongCount}
        />

        <section
          className={`card-section mine-section${locked ? " is-locked" : ""}`}
          aria-label="내 카드"
        >
          {round ? (
            <>
              <p className="card-hint">↓ 같은 그림을 찾아주세요</p>
              <CardView
                card={round.mine}
                variant="mine"
                hint={round.hint}
                clickable={!locked && status === "playing"}
                onPress={handleMinePress}
              />
            </>
          ) : isReady ? (
            <button
              type="button"
              className="card-back card-reveal"
              onClick={handleRevealFirstRound}
              aria-label="첫 카드 열기"
            >
              <span className="card-reveal-label">탭해서 카드 열기</span>
              <span className="card-reveal-hint">시간은 첫 정답부터 측정돼요</span>
            </button>
          ) : (
            <div className="card-placeholder" aria-hidden="true" />
          )}
        </section>
      </main>

      <Feedback event={lastFeedback} />

      <TutorialModal open={tutorialOpen} onClose={handleTutorialClose} />

      <ResultModal
        open={tutorialResolved && status === "finished"}
        seconds={resultSeconds}
        onRetry={handleRetry}
        onShare={handleShare}
        shareSupported={isShareSupported()}
      />
    </div>
  );
}

export default App;
