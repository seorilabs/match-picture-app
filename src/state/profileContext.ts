import { createContext, useContext } from "react";

import type { SymbolPack } from "../symbols/packs";
import type { GameMode } from "../game/mode";
import type { Profile, PurchaseResult } from "./profile";
import type { ClearInfo, DailyMissions, MissionId } from "./missions";
import type { Garden, PlantSeedReason } from "./garden";

export interface ProfileContextValue {
  profile: Profile;
  /** 저장소에서 프로필을 아직 읽는 중인지. */
  loading: boolean;
  /** 현재 장착 팩. */
  equippedPack: SymbolPack;
  ownsPack: (packId: string) => boolean;
  /** 게임 클리어 보상 코인을 지급하고, 지급한 양을 반환. */
  awardClearCoins: (
    seconds: number,
    mode: GameMode,
    maxCombo: number,
  ) => number;
  addCoins: (amount: number) => void;
  buyPack: (packId: string) => PurchaseResult;
  equip: (packId: string) => void;
  /** 오늘의 미션(날짜 리셋 반영됨). */
  missions: DailyMissions;
  /** 게임 클리어 이벤트로 미션 진행도 갱신. */
  recordGameClear: (info: ClearInfo) => void;
  /** 완료한 미션 보상 수령(코인 지급). 지급한 보상액 반환. */
  claimMission: (id: MissionId) => number;
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
}

export const ProfileContext = createContext<ProfileContextValue | null>(null);

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (ctx === null) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return ctx;
}
