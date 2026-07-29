/**
 * 플레이어 프로필: 인게임 재화(코인)와 보유/장착한 심볼팩 등 메타 진행 상태.
 *
 * 이 모듈은 순수 로직만 담는다(영속화/React 없음). 저장은 ProfileProvider가
 * `src/ait/storage.ts`(Toss Storage ↔ localStorage)로 처리한다.
 */
import {
  DEFAULT_PACK_ID,
  SYMBOL_PACKS,
  getSymbolPack,
  type SymbolPack,
} from "../symbols/packs";
import type { GameMode } from "../game/mode";
import {
  createDailyMissions,
  normalizeDailyMissions,
  type DailyMissions,
} from "./missions";
import { createGarden, normalizeGarden, type Garden } from "./garden";

export const PROFILE_STORAGE_KEY = "match-picture/profile/v1";

export interface Profile {
  /** 보유 코인. */
  coins: number;
  /** 해금한 심볼팩 ID 목록. 무료 팩(price 0)은 항상 포함된다. */
  ownedPackIds: string[];
  /** 현재 장착(사용 중) 팩 ID. */
  equippedPackId: string;
  /** 데일리 미션 진행 상태(날짜 바뀌면 Provider가 리셋). */
  missions: DailyMissions;
  /** 정원(홈 메타) 상태. */
  garden: Garden;
}

/** price 0 팩은 기본 보유로 본다. */
export function freePackIds(): string[] {
  return SYMBOL_PACKS.filter((pack) => pack.price === 0).map((pack) => pack.id);
}

export function createDefaultProfile(): Profile {
  return {
    coins: 0,
    ownedPackIds: freePackIds(),
    equippedPackId: DEFAULT_PACK_ID,
    missions: createDailyMissions(""),
    garden: createGarden(),
  };
}

/** 저장된 임의 입력을 안전한 Profile로 정규화한다(손상/구버전 방어). */
export function normalizeProfile(input: unknown): Profile {
  const base = createDefaultProfile();
  if (input == null || typeof input !== "object") return base;
  const raw = input as Record<string, unknown>;

  const coins =
    typeof raw.coins === "number" && Number.isFinite(raw.coins)
      ? Math.max(0, Math.floor(raw.coins))
      : 0;

  const ownedFromRaw = Array.isArray(raw.ownedPackIds)
    ? raw.ownedPackIds.filter((id): id is string => typeof id === "string")
    : [];
  // 무료 팩은 항상 보유 + 실제 존재하는 팩만 + 중복 제거.
  const ownedPackIds = Array.from(
    new Set([...freePackIds(), ...ownedFromRaw]),
  ).filter((id) => SYMBOL_PACKS.some((pack) => pack.id === id));

  // 장착 팩은 보유한 것 중에서만. 아니면 기본 팩.
  const equippedRaw =
    typeof raw.equippedPackId === "string" ? raw.equippedPackId : null;
  const equippedPackId =
    equippedRaw && ownedPackIds.includes(equippedRaw)
      ? equippedRaw
      : DEFAULT_PACK_ID;

  return {
    coins,
    ownedPackIds,
    equippedPackId,
    missions: normalizeDailyMissions(raw.missions),
    garden: normalizeGarden(raw.garden),
  };
}

export function parseProfile(serialized: string | null): Profile {
  if (serialized == null) return createDefaultProfile();
  try {
    return normalizeProfile(JSON.parse(serialized));
  } catch {
    return createDefaultProfile();
  }
}

export function serializeProfile(profile: Profile): string {
  return JSON.stringify(profile);
}

export function ownsPack(profile: Profile, packId: string): boolean {
  return profile.ownedPackIds.includes(packId);
}

/**
 * 게임 클리어 보상 코인.
 * 기본 보상 + 속도 보너스 + 최대 콤보 보너스. 도전장(공유 고정 덱)은 합산 후 절반.
 */
export function computeComboBonus(maxCombo: number): number {
  return Math.min(20, Math.max(0, maxCombo - 2) * 3);
}

export function computeCoinReward(
  seconds: number,
  mode: GameMode,
  maxCombo: number,
): number {
  const base = 10;
  // 20초 이내면 1초당 1코인씩 보너스(최대 20).
  const speedBonus = Math.max(0, Math.min(20, Math.round(20 - seconds)));
  const total = base + speedBonus + computeComboBonus(maxCombo);
  return mode === "challenge" ? Math.round(total / 2) : total;
}

/** 최종 지급액 중 최대 콤보가 실제로 늘린 코인 수입니다. */
export function computeAwardedComboBonus(
  seconds: number,
  mode: GameMode,
  maxCombo: number,
): number {
  return (
    computeCoinReward(seconds, mode, maxCombo) -
    computeCoinReward(seconds, mode, 0)
  );
}

export interface PurchaseResult {
  ok: boolean;
  profile: Profile;
  reason?: "already-owned" | "not-enough-coins" | "unknown-pack";
}

/** 코인으로 팩을 구매(해금). 순수 함수 — 새 Profile을 돌려준다. */
export function purchasePack(profile: Profile, packId: string): PurchaseResult {
  const pack: SymbolPack | undefined = SYMBOL_PACKS.find(
    (candidate) => candidate.id === packId,
  );
  if (!pack) return { ok: false, profile, reason: "unknown-pack" };
  if (ownsPack(profile, packId)) {
    return { ok: false, profile, reason: "already-owned" };
  }
  if (profile.coins < pack.price) {
    return { ok: false, profile, reason: "not-enough-coins" };
  }
  return {
    ok: true,
    profile: {
      ...profile,
      coins: profile.coins - pack.price,
      ownedPackIds: [...profile.ownedPackIds, packId],
    },
  };
}

/** 보유한 팩만 장착할 수 있다. */
export function equipPack(profile: Profile, packId: string): Profile {
  if (!ownsPack(profile, packId)) return profile;
  return { ...profile, equippedPackId: packId };
}

export function equippedPack(profile: Profile): SymbolPack {
  return getSymbolPack(profile.equippedPackId);
}
