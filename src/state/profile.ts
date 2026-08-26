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
  DEFAULT_DIFFICULTY_ID,
  getDifficulty,
  isDifficultyId,
  type DifficultyId,
} from "../game/difficulty";
import {
  normalizeStageProgress,
  type StageProgress,
} from "../game/stages";
import {
  createDailyMissions,
  normalizeDailyMissions,
  type DailyMissions,
} from "./missions";
import { createGarden, normalizeGarden, type Garden } from "./garden";

export const PROFILE_STORAGE_KEY = "match-picture/profile/v1";

/** 클리어 시간 분포 버킷 경계(초). */
export const TIME_BUCKET_BOUNDS = [15, 20, 30] as const;

export type TimeBucketId = "under15" | "under20" | "under30" | "over30";

export interface PlayStats {
  /** 총 클리어 판수. */
  clears: number;
  /** 모드별 클리어 판수. */
  clearsByMode: Record<GameMode, number>;
  /** 누적 정답/오답 탭 수. */
  correct: number;
  wrong: number;
  /** 무오답 클리어 판수. */
  perfectClears: number;
  /** 클리어 시간 분포. */
  buckets: Record<TimeBucketId, number>;
}

export interface StreakState {
  /** 현재 연속 출석 일수. */
  count: number;
  /** 마지막으로 보상을 받은 KST 날짜. */
  lastClaimedDate: string;
  /** 역대 최고 연속 일수. */
  best: number;
}

export interface DropletState {
  /** 보유 물방울. 정원에 물 +1로 사용한다. */
  count: number;
  /** 일일 획득 카운트를 리셋하는 기준 KST 날짜. */
  date: string;
  /** 오늘 획득한 물방울 수. */
  earnedToday: number;
}

export interface Profile {
  /** 보유 코인. */
  coins: number;
  /** 해금한 심볼팩 ID 목록. 무료 팩(price 0)은 항상 포함된다. */
  ownedPackIds: string[];
  /** 현재 장착(사용 중) 팩 ID. */
  equippedPackId: string;
  /** 선택한 난이도(클래식 전용. 데일리/도전장은 보통 고정). */
  difficulty: DifficultyId;
  /** 데일리 미션 진행 상태(날짜 바뀌면 Provider가 리셋). */
  missions: DailyMissions;
  /** 정원(홈 메타) 상태. */
  garden: Garden;
  /** 누적 플레이 통계. */
  stats: PlayStats;
  /** 연속 출석 보상 상태. */
  streak: StreakState;
  /** 게임 클리어로 모으는 물방울. */
  droplets: DropletState;
  /** 스테이지 진행(스테이지 번호 → 최고 별 수). */
  stages: StageProgress;
}

const GAME_MODES: GameMode[] = ["classic", "daily", "challenge", "stage"];

export function createDefaultStats(): PlayStats {
  return {
    clears: 0,
    clearsByMode: { classic: 0, daily: 0, challenge: 0, stage: 0 },
    correct: 0,
    wrong: 0,
    perfectClears: 0,
    buckets: { under15: 0, under20: 0, under30: 0, over30: 0 },
  };
}

export function createDefaultStreak(): StreakState {
  return { count: 0, lastClaimedDate: "", best: 0 };
}

export function createDefaultDroplets(): DropletState {
  return { count: 0, date: "", earnedToday: 0 };
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
    difficulty: DEFAULT_DIFFICULTY_ID,
    missions: createDailyMissions(""),
    garden: createGarden(),
    stats: createDefaultStats(),
    streak: createDefaultStreak(),
    droplets: createDefaultDroplets(),
    stages: {},
  };
}

function safeCount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.floor(value))
    : 0;
}

export function normalizeStats(input: unknown): PlayStats {
  const base = createDefaultStats();
  if (input == null || typeof input !== "object") return base;
  const raw = input as Record<string, unknown>;

  const rawByMode =
    raw.clearsByMode && typeof raw.clearsByMode === "object"
      ? (raw.clearsByMode as Record<string, unknown>)
      : {};
  const clearsByMode = { ...base.clearsByMode };
  for (const mode of GAME_MODES) {
    clearsByMode[mode] = safeCount(rawByMode[mode]);
  }

  const rawBuckets =
    raw.buckets && typeof raw.buckets === "object"
      ? (raw.buckets as Record<string, unknown>)
      : {};
  const buckets = { ...base.buckets };
  for (const key of Object.keys(base.buckets) as TimeBucketId[]) {
    buckets[key] = safeCount(rawBuckets[key]);
  }

  return {
    clears: safeCount(raw.clears),
    clearsByMode,
    correct: safeCount(raw.correct),
    wrong: safeCount(raw.wrong),
    perfectClears: safeCount(raw.perfectClears),
    buckets,
  };
}

export function normalizeStreak(input: unknown): StreakState {
  const base = createDefaultStreak();
  if (input == null || typeof input !== "object") return base;
  const raw = input as Record<string, unknown>;
  const count = safeCount(raw.count);
  return {
    count,
    lastClaimedDate:
      typeof raw.lastClaimedDate === "string" ? raw.lastClaimedDate : "",
    best: Math.max(count, safeCount(raw.best)),
  };
}

export function normalizeDroplets(input: unknown): DropletState {
  const base = createDefaultDroplets();
  if (input == null || typeof input !== "object") return base;
  const raw = input as Record<string, unknown>;
  return {
    count: safeCount(raw.count),
    date: typeof raw.date === "string" ? raw.date : "",
    earnedToday: safeCount(raw.earnedToday),
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
    difficulty: isDifficultyId(raw.difficulty)
      ? raw.difficulty
      : DEFAULT_DIFFICULTY_ID,
    missions: normalizeDailyMissions(raw.missions),
    garden: normalizeGarden(raw.garden),
    stats: normalizeStats(raw.stats),
    streak: normalizeStreak(raw.streak),
    droplets: normalizeDroplets(raw.droplets),
    stages: normalizeStageProgress(raw.stages),
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
 * 기본 보상 + 속도 보너스 + 최대 콤보 보너스에 난이도 가중을 곱한다.
 * 도전장(공유 고정 덱)은 합산 후 절반.
 */
export function computeComboBonus(maxCombo: number): number {
  return Math.min(20, Math.max(0, maxCombo - 2) * 3);
}

export function computeCoinReward(
  seconds: number,
  mode: GameMode,
  maxCombo: number,
  difficulty: DifficultyId = DEFAULT_DIFFICULTY_ID,
): number {
  const base = 10;
  // 20초 이내면 1초당 1코인씩 보너스(최대 20).
  const speedBonus = Math.max(0, Math.min(20, Math.round(20 - seconds)));
  const total = base + speedBonus + computeComboBonus(maxCombo);
  const weighted = Math.round(total * getDifficulty(difficulty).rewardMultiplier);
  return mode === "challenge" ? Math.round(weighted / 2) : weighted;
}

/** 최종 지급액 중 최대 콤보가 실제로 늘린 코인 수입니다. */
export function computeAwardedComboBonus(
  seconds: number,
  mode: GameMode,
  maxCombo: number,
  difficulty: DifficultyId = DEFAULT_DIFFICULTY_ID,
): number {
  return (
    computeCoinReward(seconds, mode, maxCombo, difficulty) -
    computeCoinReward(seconds, mode, 0, difficulty)
  );
}

export interface ClearStatsInput {
  mode: GameMode;
  seconds: number;
  correctCount: number;
  wrongCount: number;
}

export function timeBucketId(seconds: number): TimeBucketId {
  const [fast, quick, normal] = TIME_BUCKET_BOUNDS;
  if (seconds <= fast) return "under15";
  if (seconds <= quick) return "under20";
  if (seconds <= normal) return "under30";
  return "over30";
}

/** 한 판의 클리어 결과를 누적 통계에 반영한다. */
export function applyClearStats(
  stats: PlayStats,
  info: ClearStatsInput,
): PlayStats {
  const bucket = timeBucketId(info.seconds);
  return {
    clears: stats.clears + 1,
    clearsByMode: {
      ...stats.clearsByMode,
      [info.mode]: (stats.clearsByMode[info.mode] ?? 0) + 1,
    },
    correct: stats.correct + Math.max(0, info.correctCount),
    wrong: stats.wrong + Math.max(0, info.wrongCount),
    perfectClears: stats.perfectClears + (info.wrongCount === 0 ? 1 : 0),
    buckets: { ...stats.buckets, [bucket]: stats.buckets[bucket] + 1 },
  };
}

/** 정확도(0~1). 탭이 하나도 없으면 null. */
export function accuracy(correct: number, wrong: number): number | null {
  const total = correct + wrong;
  if (total <= 0) return null;
  return correct / total;
}

/** 연속 출석 일차별 보상 코인. 7일 이후는 마지막 값을 유지한다. */
export const STREAK_REWARDS = [10, 15, 20, 25, 30, 40, 50];

export function streakReward(day: number): number {
  if (day <= 0) return 0;
  const index = Math.min(day, STREAK_REWARDS.length) - 1;
  return STREAK_REWARDS[index];
}

function previousDateString(dateString: string): string {
  const time = Date.parse(`${dateString}T00:00:00Z`);
  if (Number.isNaN(time)) return "";
  return new Date(time - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export interface StreakEvaluation {
  streak: StreakState;
  /** 이번 호출로 지급할 코인. 이미 오늘 받았으면 0. */
  reward: number;
  /** 오늘 보상을 새로 지급했는지. */
  claimed: boolean;
}

/**
 * 오늘 출석 보상을 평가한다.
 * - 어제 받았으면 연속일 +1
 * - 오늘 이미 받았으면 아무 일도 하지 않는다(중복 지급 없음)
 * - 하루 이상 비었으면 1일차로 리셋
 */
export function evaluateStreak(
  streak: StreakState,
  today: string,
): StreakEvaluation {
  if (today === "") return { streak, reward: 0, claimed: false };
  if (streak.lastClaimedDate === today) {
    return { streak, reward: 0, claimed: false };
  }

  const continued = streak.lastClaimedDate === previousDateString(today);
  const count = continued ? streak.count + 1 : 1;
  const reward = streakReward(count);
  return {
    streak: {
      count,
      lastClaimedDate: today,
      best: Math.max(streak.best, count),
    },
    reward,
    claimed: true,
  };
}

/** 하루에 게임 클리어로 얻을 수 있는 물방울 상한. */
export const DROPLET_DAILY_CAP = 3;

export interface DropletGain {
  droplets: DropletState;
  gained: number;
}

/**
 * 클리어 보상 물방울을 계산한다.
 * 데일리 모드 클리어는 2방울, 그 외 모드는 1방울이며 KST 하루 상한을 넘지 않는다.
 */
export function awardDroplets(
  droplets: DropletState,
  mode: GameMode,
  today: string,
): DropletGain {
  const reset = droplets.date === today ? droplets : { ...droplets, date: today, earnedToday: 0 };
  const desired = mode === "daily" ? 2 : 1;
  const gained = Math.max(0, Math.min(desired, DROPLET_DAILY_CAP - reset.earnedToday));
  if (gained === 0) return { droplets: reset, gained: 0 };
  return {
    droplets: {
      count: reset.count + gained,
      date: today,
      earnedToday: reset.earnedToday + gained,
    },
    gained,
  };
}

/** 물방울 1개를 사용한다. 잔량이 없으면 실패. */
export function spendDroplet(droplets: DropletState): {
  ok: boolean;
  droplets: DropletState;
} {
  if (droplets.count <= 0) return { ok: false, droplets };
  return { ok: true, droplets: { ...droplets, count: droplets.count - 1 } };
}

export interface PurchaseResult {
  ok: boolean;
  profile: Profile;
  reason?: "already-owned" | "not-enough-coins" | "unknown-pack";
}

export interface SpendCoinsResult {
  ok: boolean;
  profile: Profile;
  reason?: "invalid-amount" | "not-enough-coins";
}

/** 소비형 아이템 가격만큼 코인을 차감한다. 실패 시 원래 Profile을 그대로 돌려준다. */
export function spendCoins(profile: Profile, amount: number): SpendCoinsResult {
  if (!Number.isInteger(amount) || amount <= 0) {
    return { ok: false, profile, reason: "invalid-amount" };
  }
  if (profile.coins < amount) {
    return { ok: false, profile, reason: "not-enough-coins" };
  }
  return {
    ok: true,
    profile: {
      ...profile,
      coins: profile.coins - amount,
    },
  };
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
