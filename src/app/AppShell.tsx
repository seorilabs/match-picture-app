import { useCallback, useState } from "react";

import { TabBar, type TabId } from "./TabBar";
import { HomeScreen } from "../screens/HomeScreen";
import { ShopScreen } from "../screens/ShopScreen";
import { MissionsScreen } from "../screens/MissionsScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { GameScreen } from "../screens/GameScreen";
import {
  getChallengeParamsFromLocation,
  type GameMode,
} from "../game/mode";

export function AppShell() {
  const [activeTab, setActiveTab] = useState<TabId>("home");
  // 도전장 링크로 진입한 경우 곧바로 게임을 띄운다.
  const [gameMode, setGameMode] = useState<GameMode | null>(() =>
    getChallengeParamsFromLocation() !== null ? "challenge" : null,
  );

  const handleStartGame = useCallback((mode: GameMode) => {
    setGameMode(mode);
  }, []);

  const handleExitToHome = useCallback(() => {
    setGameMode(null);
    setActiveTab("home");
  }, []);

  if (gameMode !== null) {
    return (
      <GameScreen initialMode={gameMode} onExitToHome={handleExitToHome} />
    );
  }

  return (
    <div className="app-shell">
      <div className="app-screen-area">
        {activeTab === "home" ? (
          <HomeScreen onStartGame={handleStartGame} />
        ) : activeTab === "shop" ? (
          <ShopScreen />
        ) : activeTab === "missions" ? (
          <MissionsScreen />
        ) : (
          <SettingsScreen />
        )}
      </div>
      <TabBar active={activeTab} onChange={setActiveTab} />
    </div>
  );
}
