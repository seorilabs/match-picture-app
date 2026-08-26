import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { readItem, writeItem } from "../ait/storage";
import { useVisibleCallback } from "../ait/visibility";
import { SYMBOL_PACK_STORAGE_KEY, getSymbolPack } from "../symbols/packs";
import { getKstDateString, type GameMode } from "../game/mode";
import type { DifficultyId } from "../game/difficulty";
import { applyStageClear, type StageClearResult } from "../game/stages";
import {
  applyClear,
  claim as claimMissionPure,
  ensureToday,
  type MissionId,
} from "./missions";
import {
  FERTILIZER_COST,
  ensureDailyReset as ensureGardenReset,
  plantSeed as plantSeedPure,
  removePlant as removePlantPure,
  waterAll,
  waterPlot,
} from "./garden";
import { getSpecies } from "../garden/species";
import {
  ProfileContext,
  type ClearRecord,
  type ProfileContextValue,
  type StreakClaimResult,
} from "./profileContext";
import {
  PROFILE_STORAGE_KEY,
  applyClearStats,
  awardDroplets,
  computeCoinReward,
  createDefaultProfile,
  equipPack,
  equippedPack as selectEquippedPack,
  evaluateStreak,
  ownsPack,
  parseProfile,
  purchasePack,
  serializeProfile,
  spendCoins as spendProfileCoins,
  spendDroplet,
  type Profile,
  type PurchaseResult,
  type SpendCoinsResult,
} from "./profile";

/** 날짜 경계를 놓치지 않기 위한 가벼운 주기 확인(1분). */
const DATE_CHECK_INTERVAL_MS = 60 * 1000;

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile>(createDefaultProfile);
  const [loading, setLoading] = useState(true);
  // 미션/물주기 날짜 비교 기준. 복귀·주기 확인으로 자정 경과를 반영한다.
  const [today, setToday] = useState(getKstDateString);
  // 로드 완료 전에는 영속화하지 않아 기본값이 저장본을 덮어쓰지 않게 한다.
  const hydratedRef = useRef(false);

  const refreshToday = useCallback(() => {
    const current = getKstDateString();
    setToday((previous) => (previous === current ? previous : current));
  }, []);

  useVisibleCallback(refreshToday);

  useEffect(() => {
    const timer = window.setInterval(refreshToday, DATE_CHECK_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [refreshToday]);

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
    // 최초 1회만 로드한다. 이후 날짜 변경은 아래 effect가 반영한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 날짜가 바뀌면 저장 상태 자체를 새 날짜로 리셋해 stale 적립을 막는다.
  useEffect(() => {
    if (!hydratedRef.current) return;
    setProfile((current) => {
      const missions = ensureToday(current.missions, today);
      const garden = ensureGardenReset(current.garden, today);
      if (missions === current.missions && garden === current.garden) {
        return current;
      }
      return { ...current, missions, garden };
    });
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
    (
      seconds: number,
      mode: GameMode,
      maxCombo: number,
      difficulty?: DifficultyId,
    ) => {
      let reward = 0;
      setProfile((current) => {
        reward = computeCoinReward(
          seconds,
          mode,
          maxCombo,
          difficulty ?? current.difficulty,
        );
        if (reward <= 0) return current;
        return { ...current, coins: current.coins + reward };
      });
      return reward;
    },
    [],
  );

  const spendCoins = useCallback((amount: number): SpendCoinsResult => {
    let result: SpendCoinsResult = {
      ok: false,
      profile: createDefaultProfile(),
      reason: "invalid-amount",
    };
    setProfile((current) => {
      result = spendProfileCoins(current, amount);
      return result.ok ? result.profile : current;
    });
    return result;
  }, []);

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

  const setDifficulty = useCallback((difficulty: DifficultyId) => {
    setProfile((current) =>
      current.difficulty === difficulty ? current : { ...current, difficulty },
    );
  }, []);

  const recordGameClear = useCallback(
    (info: ClearRecord) => {
      let gainedDroplets = 0;
      setProfile((current) => {
        const droplets = awardDroplets(current.droplets, info.mode, today);
        gainedDroplets = droplets.gained;
        return {
          ...current,
          missions: applyClear(ensureToday(current.missions, today), info),
          stats: applyClearStats(current.stats, {
            mode: info.mode,
            seconds: info.seconds,
            correctCount: info.correctCount,
            wrongCount: info.wrongCount,
          }),
          droplets: droplets.droplets,
        };
      });
      return gainedDroplets;
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

  const claimStreak = useCallback((): StreakClaimResult => {
    let result: StreakClaimResult = { count: 0, reward: 0, claimed: false };
    setProfile((current) => {
      const evaluation = evaluateStreak(current.streak, today);
      result = {
        count: evaluation.streak.count,
        reward: evaluation.reward,
        claimed: evaluation.claimed,
      };
      if (!evaluation.claimed) return current;
      return {
        ...current,
        streak: evaluation.streak,
        coins: current.coins + evaluation.reward,
      };
    });
    return result;
  }, [today]);

  const recordStageClear = useCallback(
    (stageId: number, seconds: number, wrongCount: number): StageClearResult => {
      let result: StageClearResult = {
        progress: {},
        stars: 0,
        gainedStars: 0,
        coins: 0,
        unlockedStageId: null,
      };
      setProfile((current) => {
        result = applyStageClear(current.stages, stageId, seconds, wrongCount);
        return {
          ...current,
          stages: result.progress,
          coins: current.coins + result.coins,
        };
      });
      return result;
    },
    [],
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
      return {
        ...current,
        garden: placed.garden,
        coins: current.coins - price,
      };
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
      const result = waterPlot(current.garden, plotIndex);
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

  const waterWithDroplet = useCallback((plotIndex: number) => {
    let outcome: { ok: boolean; reward: number; reason?: "no-droplet" } = {
      ok: false,
      reward: 0,
    };
    setProfile((current) => {
      const spent = spendDroplet(current.droplets);
      if (!spent.ok) {
        outcome = { ok: false, reward: 0, reason: "no-droplet" };
        return current;
      }
      const result = waterPlot(current.garden, plotIndex);
      if (!result.applied) {
        outcome = { ok: false, reward: 0 };
        return current;
      }
      outcome = { ok: true, reward: result.reward };
      return {
        ...current,
        droplets: spent.droplets,
        garden: result.garden,
        coins: current.coins + result.reward,
      };
    });
    return outcome;
  }, []);

  const value = useMemo<ProfileContextValue>(
    () => ({
      profile,
      loading,
      today,
      equippedPack: selectEquippedPack(profile),
      ownsPack: (packId: string) => ownsPack(profile, packId),
      awardClearCoins,
      addCoins,
      spendCoins,
      buyPack,
      equip,
      setDifficulty,
      missions: ensureToday(profile.missions, today),
      recordGameClear,
      claimMission,
      claimStreak,
      recordStageClear,
      garden: ensureGardenReset(profile.garden, today),
      waterGarden,
      plantSeed,
      removePlant,
      fertilizePlant,
      waterWithDroplet,
    }),
    [
      addCoins,
      awardClearCoins,
      buyPack,
      claimMission,
      claimStreak,
      equip,
      fertilizePlant,
      loading,
      plantSeed,
      profile,
      recordGameClear,
      recordStageClear,
      removePlant,
      setDifficulty,
      spendCoins,
      today,
      waterWithDroplet,
      waterGarden,
    ],
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}
