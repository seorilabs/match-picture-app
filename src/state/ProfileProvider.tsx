import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { readItem, writeItem } from "../ait/storage";
import { SYMBOL_PACK_STORAGE_KEY, getSymbolPack } from "../symbols/packs";
import { getKstDateString, type GameMode } from "../game/mode";
import {
  applyClear,
  claim as claimMissionPure,
  ensureToday,
  type ClearInfo,
  type MissionId,
} from "./missions";
import {
  FERTILIZER_COST,
  ensureDailyReset as ensureGardenReset,
  fertilize as fertilizePure,
  plantSeed as plantSeedPure,
  removePlant as removePlantPure,
  waterAll,
} from "./garden";
import { getSpecies } from "../garden/species";
import { ProfileContext, type ProfileContextValue } from "./profileContext";
import {
  PROFILE_STORAGE_KEY,
  computeCoinReward,
  createDefaultProfile,
  equipPack,
  equippedPack as selectEquippedPack,
  ownsPack,
  parseProfile,
  purchasePack,
  serializeProfile,
  type Profile,
  type PurchaseResult,
} from "./profile";

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile>(createDefaultProfile);
  const [loading, setLoading] = useState(true);
  // 미션 날짜 비교 기준. 세션 동안 고정(자정 넘김은 재실행 시 반영).
  const [today] = useState(getKstDateString);
  // 로드 완료 전에는 영속화하지 않아 기본값이 저장본을 덮어쓰지 않게 한다.
  const hydratedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await readItem(PROFILE_STORAGE_KEY);
      let next = parseProfile(stored);

      // 레거시 마이그레이션: 프로필이 아직 없던 사용자는 예전에 무료로 쓰던
      // 테마(SYMBOL_PACK_STORAGE_KEY)를 보유/장착 상태로 이어준다.
      if (stored == null) {
        const legacyPackId = await readItem(SYMBOL_PACK_STORAGE_KEY);
        if (legacyPackId != null) {
          const legacy = getSymbolPack(legacyPackId);
          next = {
            ...next,
            ownedPackIds: Array.from(
              new Set([...next.ownedPackIds, legacy.id]),
            ),
            equippedPackId: legacy.id,
          };
        }
      }

      // 날짜가 지났으면 오늘의 미션/물주기를 리셋.
      next = {
        ...next,
        missions: ensureToday(next.missions, today),
        garden: ensureGardenReset(next.garden, today),
      };

      if (cancelled) return;
      hydratedRef.current = true;
      setProfile(next);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [today]);

  // 프로필 변경 시 영속화(로드 완료 후에만).
  useEffect(() => {
    if (!hydratedRef.current) return;
    void writeItem(PROFILE_STORAGE_KEY, serializeProfile(profile));
  }, [profile]);

  const addCoins = useCallback((amount: number) => {
    if (amount === 0) return;
    setProfile((current) => ({
      ...current,
      coins: Math.max(0, current.coins + amount),
    }));
  }, []);

  const awardClearCoins = useCallback(
    (seconds: number, mode: GameMode, maxCombo: number) => {
      const reward = computeCoinReward(seconds, mode, maxCombo);
      if (reward > 0) {
        setProfile((current) => ({
          ...current,
          coins: current.coins + reward,
        }));
      }
      return reward;
    },
    [],
  );

  const buyPack = useCallback((packId: string): PurchaseResult => {
    let result: PurchaseResult = { ok: false, profile: createDefaultProfile() };
    setProfile((current) => {
      result = purchasePack(current, packId);
      return result.ok ? result.profile : current;
    });
    return result;
  }, []);

  const equip = useCallback((packId: string) => {
    setProfile((current) => equipPack(current, packId));
  }, []);

  const recordGameClear = useCallback(
    (info: ClearInfo) => {
      setProfile((current) => ({
        ...current,
        missions: applyClear(ensureToday(current.missions, today), info),
      }));
    },
    [today],
  );

  const claimMission = useCallback(
    (id: MissionId) => {
      let reward = 0;
      setProfile((current) => {
        const ensured = ensureToday(current.missions, today);
        const result = claimMissionPure(ensured, id);
        reward = result.reward;
        return {
          ...current,
          missions: result.missions,
          coins: current.coins + result.reward,
        };
      });
      return reward;
    },
    [today],
  );

  const waterGarden = useCallback(() => {
    let result = { reward: 0, matured: 0 };
    setProfile((current) => {
      const garden = ensureGardenReset(current.garden, today);
      const watered = waterAll(garden);
      result = { reward: watered.reward, matured: watered.matured };
      return {
        ...current,
        garden: watered.garden,
        coins: current.coins + watered.reward,
      };
    });
    return result;
  }, [today]);

  const plantSeed = useCallback((speciesId: string) => {
    let outcome: {
      ok: boolean;
      reason?: ReturnType<typeof plantSeedPure>["reason"] | "not-enough-coins";
    } = { ok: false };
    setProfile((current) => {
      const price = getSpecies(speciesId).seedPrice;
      if (current.coins < price) {
        outcome = { ok: false, reason: "not-enough-coins" };
        return current;
      }
      const placed = plantSeedPure(current.garden, speciesId);
      if (!placed.ok) {
        outcome = { ok: false, reason: placed.reason };
        return current;
      }
      outcome = { ok: true };
      return { ...current, garden: placed.garden, coins: current.coins - price };
    });
    return outcome;
  }, []);

  const removePlant = useCallback((plotIndex: number) => {
    setProfile((current) => ({
      ...current,
      garden: removePlantPure(current.garden, plotIndex),
    }));
  }, []);

  const fertilizePlant = useCallback((plotIndex: number) => {
    let outcome: {
      ok: boolean;
      reward: number;
      reason?: "not-enough-coins";
    } = { ok: false, reward: 0 };
    setProfile((current) => {
      if (current.coins < FERTILIZER_COST) {
        outcome = { ok: false, reward: 0, reason: "not-enough-coins" };
        return current;
      }
      const result = fertilizePure(current.garden, plotIndex);
      if (!result.applied) {
        outcome = { ok: false, reward: 0 };
        return current;
      }
      outcome = { ok: true, reward: result.reward };
      return {
        ...current,
        garden: result.garden,
        coins: current.coins - FERTILIZER_COST + result.reward,
      };
    });
    return outcome;
  }, []);

  const value = useMemo<ProfileContextValue>(
    () => ({
      profile,
      loading,
      equippedPack: selectEquippedPack(profile),
      ownsPack: (packId: string) => ownsPack(profile, packId),
      awardClearCoins,
      addCoins,
      buyPack,
      equip,
      missions: ensureToday(profile.missions, today),
      recordGameClear,
      claimMission,
      garden: ensureGardenReset(profile.garden, today),
      waterGarden,
      plantSeed,
      removePlant,
      fertilizePlant,
    }),
    [
      addCoins,
      awardClearCoins,
      buyPack,
      claimMission,
      equip,
      fertilizePlant,
      loading,
      plantSeed,
      profile,
      recordGameClear,
      removePlant,
      today,
      waterGarden,
    ],
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}
