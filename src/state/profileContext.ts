import { createContext, useContext } from "react";

import type { SymbolPack } from "../symbols/packs";
import type { GameMode } from "../game/mode";
import type { DifficultyId } from "../game/difficulty";
import type { StageClearResult } from "../game/stages";
import type { Profile, PurchaseResult, SpendCoinsResult } from "./profile";
import type { ClearInfo, DailyMissions, MissionId } from "./missions";
import type { Garden, PlantSeedReason } from "./garden";

export interface ClearRecord extends ClearInfo {
  correctCount: number;
}

export interface ClearRewardResult {
  coins: number;
  comboBonus: number;
  droplets: number;
}

export interface StreakClaimResult {
  count: number;
  reward: number;
  claimed: boolean;
}

export interface ProfileContextValue {
  profile: Profile;
  /** 저장소에서 프로필을 아직 읽는 중인지. */
  loading: boolean;
  /** KST 기준 오늘 날짜. 자정을 넘기거나 앱이 복귀하면 갱신된다. */
  today: string;
  /** 현재 장착 팩. */
  equippedPack: SymbolPack;
  ownsPack: (packId: string) => boolean;
  /** 게임 클리어 보상 코인을 지급하고, 지급한 양을 반환. */
  awardClearCoins: (
    seconds: number,
    mode: GameMode,
    maxCombo: number,
    difficulty?: DifficultyId,
  ) => number;
  addCoins: (amount: number) => void;
  /** 소비형 아이템 가격을 정확히 차감한다. */
  spendCoins: (amount: number) => SpendCoinsResult;
  buyPack: (packId: string) => PurchaseResult;
  equip: (packId: string) => void;
  /** 선택 난이도 변경(클래식/스테이지 밖 모드에는 영향 없음). */
  setDifficulty: (difficulty: DifficultyId) => void;
  /** 오늘의 미션(날짜 리셋 반영됨). */
  missions: DailyMissions;
  /** 게임 클리어를 미션·통계·물방울에 반영하고 획득한 물방울 수를 반환. */
  recordGameClear: (info: ClearRecord) => number;
  /** 완료한 미션 보상 수령(코인 지급). 지급한 보상액 반환. */
  claimMission: (id: MissionId) => number;
  /** 오늘의 출석 보상을 받는다. */
  claimStreak: () => StreakClaimResult;
  /** 스테이지 클리어를 진행 상태에 반영하고 별/보상 결과를 반환. */
  recordStageClear: (
    stageId: number,
    seconds: number,
    wrongCount: number,
  ) => StageClearResult;
  /** 정원(날짜 리셋 반영됨). */
  garden: Garden;
  /** 데일리 무료 물주기. 다 자란 식물 보상 코인을 지급하고 결과를 반환. */
  waterGarden: () => { reward: number; matured: number };
  /** 코인으로 씨앗을 심는다. */
  plantSeed: (speciesId: string) => {
    ok: boolean;
    reason?: PlantSeedReason | "not-enough-coins";
  };
  /** 화분을 비운다. */
  removePlant: (plotIndex: number) => void;
  /** 코인으로 비료(물 +1 즉시). 적용 여부·보상을 반환. */
  fertilizePlant: (plotIndex: number) => {
    ok: boolean;
    reward: number;
    reason?: "not-enough-coins";
  };
  /** 게임으로 모은 물방울로 물 +1. */
  waterWithDroplet: (plotIndex: number) => {
    ok: boolean;
    reward: number;
    reason?: "no-droplet";
  };
}

export const ProfileContext = createContext<ProfileContextValue | null>(null);

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (ctx === null) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return ctx;
}
