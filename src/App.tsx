import { useCallback, useEffect, useRef, useState } from "react";

import "./App.css";

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

/** Unity quirks 때문에 첫 큐에 들어가는 카드 수는 TOTAL_CARDS + 1입니다. */
const INITIAL_QUEUE_SIZE = TOTAL_CARDS + 1;

function App() {
  const game = useGame();
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [tutorialResolved, setTutorialResolved] = useState(false);

  const ad = useInterstitialAd();
  // 게임 화면이 살아있는 동안 화면 항상 켜짐.
  useScreenAwake(true);

  // 한 세션에 리뷰 요청은 한 번만 호출합니다 (정책 보호 + 사용자 경험).
  const reviewRequestedRef = useRef(false);
  const lastSubmittedSecondsRef = useRef<number | null>(null);

  // 최초 진입 시 튜토리얼 노출 여부를 결정합니다. Apps in Toss Storage 우선, 없으면 localStorage.
  // game 객체 전체를 deps에 넣으면 game.start 호출로 상태가 바뀔 때마다 effect가 재실행되어
  // 무한 루프로 프리징되므로, stable한 game.start callback만 deps로 잡습니다.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const flag = await readItem(TUTORIAL_KEY);
      if (cancelled) return;
      if (flag) {
        setTutorialOpen(false);
        setTutorialResolved(true);
        game.start();
      } else {
        setTutorialOpen(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [game.start]);

  // 클리어 시점에 리더보드 제출 + 리뷰 요청을 시도합니다. 모두 조용한 실패가 기본이라 게임 흐름을 막지 않습니다.
  useEffect(() => {
    if (game.status !== "finished" || game.resultSeconds === null) return;
    const seconds = game.resultSeconds;
    if (lastSubmittedSecondsRef.current !== seconds) {
      lastSubmittedSecondsRef.current = seconds;
      void submitClearTime(seconds);
    }
    if (!reviewRequestedRef.current) {
      reviewRequestedRef.current = true;
      void requestReviewIfSupported();
    }
  }, [game.resultSeconds, game.status]);

  const handleTutorialClose = useCallback(() => {
    setTutorialOpen(false);
    setTutorialResolved(true);
    void writeItem(TUTORIAL_KEY, "1");
    game.start();
  }, [game.start]);

  const handleRetry = useCallback(async () => {
    // 광고가 로드되어 있으면 노출 후 게임 시작. 그렇지 않으면 즉시 시작.
    if (ad.ready) {
      await ad.show();
    }
    game.retry();
  }, [ad.ready, ad.show, game.retry]);

  const handleShare = useCallback(async () => {
    if (game.resultSeconds === null) return;
    await shareScore(game.resultSeconds);
  }, [game.resultSeconds]);

  return (
    <div className="game-shell">
      <header className="game-header">
        <h1 className="game-title">같은그림찾기</h1>
      </header>

      <main className="game-main">
        <section className="card-section opponent-section" aria-label="상대 카드">
          {game.round ? (
            <CardView
              card={game.round.opponent}
              variant="opponent"
              hint={game.round.hint}
              clickable={false}
              onPress={() => undefined}
            />
          ) : (
            <div className="card-placeholder" />
          )}
        </section>

        <Hud
          remaining={game.remaining}
          totalRemaining={INITIAL_QUEUE_SIZE - 1}
          elapsedSeconds={game.elapsedSeconds}
          correctCount={game.correctCount}
          wrongCount={game.wrongCount}
        />

        <section className="card-section mine-section" aria-label="내 카드">
          {game.round ? (
            <CardView
              card={game.round.mine}
              variant="mine"
              hint={game.round.hint}
              clickable={!game.locked && game.status === "playing"}
              onPress={(symbol, origin) => game.tap(symbol, { origin })}
            />
          ) : (
            <div className="card-placeholder" />
          )}
        </section>
      </main>

      <Feedback event={game.lastFeedback} />

      <TutorialModal open={tutorialOpen} onClose={handleTutorialClose} />

      <ResultModal
        open={tutorialResolved && game.status === "finished"}
        seconds={game.resultSeconds}
        onRetry={handleRetry}
        onShare={handleShare}
        shareSupported={isShareSupported()}
      />
    </div>
  );
}

export default App;
