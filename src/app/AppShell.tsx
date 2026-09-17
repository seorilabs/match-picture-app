import { useCallback, useState } from "react";

import { TabBar, type TabId } from "./TabBar";
import { HomeScreen } from "../screens/HomeScreen";
import { ShopScreen } from "../screens/ShopScreen";
import { MissionsScreen } from "../screens/MissionsScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { GameScreen } from "../screens/GameScreen";
import {
  consumeChallengeParamsFromLocation,
  type GameMode,
} from "../game/mode";
import { useBackHandler } from "../native/backButton";

interface GameEntry {
  mode: GameMode;
  stageId: number | null;
  archiveDate: string | null;
}

export function AppShell() {
  const [activeTab, setActiveTab] = useState<TabId>("home");

  // 도전장 파라미터는 앱 시작 시 한 번만 소비한다(쿼리는 즉시 주소에서 제거).
  const [challengeParams] = useState(consumeChallengeParamsFromLocation);
  const [game, setGame] = useState<GameEntry | null>(() =>
    challengeParams !== null
      ? { mode: "challenge", stageId: null, archiveDate: null }
      : null,
  );

  const handleStartGame = useCallback((mode: GameMode) => {
    setGame({ mode, stageId: null, archiveDate: null });
  }, []);

  const handleStartStage = useCallback((stageId: number) => {
    setGame({ mode: "stage", stageId, archiveDate: null });
  }, []);

  const handleStartArchive = useCallback((archiveDate: string) => {
    setGame({ mode: "daily", stageId: null, archiveDate });
  }, []);

  const handleExitToHome = useCallback(() => {
    setGame(null);
    setActiveTab("home");
  }, []);

  // 홈이 아닌 탭에서 뒤로가기는 홈으로 돌아온다. 홈 최상위는 앱 종료(백그라운드)로 넘긴다.
  useBackHandler(game === null && activeTab !== "home", () => {
    setActiveTab("home");
    return true;
  });

  if (game !== null) {
    return (
      <GameScreen
        initialMode={game.mode}
        challengeParams={challengeParams}
        stageId={game.stageId}
        archiveDate={game.archiveDate}
        onExitToHome={handleExitToHome}
      />
    );
  }

  return (
    <div className="app-shell">
      <div className="app-screen-area">
        {activeTab === "home" ? (
          <HomeScreen
            onStartGame={handleStartGame}
            onStartStage={handleStartStage}
            onStartArchive={handleStartArchive}
          />
        ) : activeTab === "shop" ? (
          <ShopScreen />
        ) : activeTab === "missions" ? (
          <MissionsScreen />
        ) : (
          <SettingsScreen onOpenShop={() => setActiveTab("shop")} />
        )}
      </div>
      <TabBar active={activeTab} onChange={setActiveTab} />
    </div>
  );
}
