/**
 * 데일리 미션: 매일(KST) 갱신되는 목표와 보상. 순수 로직만 담는다.
 * 진행도 갱신/보상 수령은 ProfileProvider가 호출하고, 보상 코인은 프로필 지갑에 더해진다.
 *
 * 미션 풀에서 KST 날짜 시드로 매일 3개를 결정적으로 뽑는다.
 * 같은 날짜면 모든 사용자가 같은 미션을 본다(데일리 덱과 같은 철학).
 */
import type { GameMode } from "../game/mode";
import { hashSeed, mulberry32 } from "../game/rng";

export type MissionId =
  | "play3"
  | "play5"
  | "fastClear"
  | "comboMaster"
  | "daily"
  | "noMistake";

export interface MissionDef {
  id: MissionId;
  reward: number;
  target: number;
}

/** "빠른 클리어" 미션 인정 기준(초). */
export const FAST_CLEAR_THRESHOLD_SECONDS = 15;

/** "콤보 마스터" 미션 인정 기준(최대 콤보). */
export const COMBO_MASTER_THRESHOLD = 5;

/** 하루에 노출할 미션 수. */
export const DAILY_MISSION_COUNT = 3;

// 표시 라벨은 i18n 사전의 mission.<id>.label 키에 있다.
export const MISSION_POOL: MissionDef[] = [
  { id: "play3", reward: 30, target: 3 },
  { id: "play5", reward: 45, target: 5 },
  { id: "fastClear", reward: 50, target: 1 },
  { id: "comboMaster", reward: 45, target: 1 },
  { id: "daily", reward: 40, target: 1 },
  { id: "noMistake", reward: 55, target: 1 },
];

export function missionDef(id: MissionId): MissionDef {
  // MISSION_POOL은 모든 MissionId를 포함하므로 항상 존재한다.
  return MISSION_POOL.find((def) => def.id === id) as MissionDef;
}

function isMissionId(value: unknown): value is MissionId {
  return MISSION_POOL.some((def) => def.id === value);
}

/**
 * 날짜 문자열을 시드로 그날의 미션을 결정적으로 고른다.
 * 날짜가 비어 있으면(최초 실행) 풀 앞에서부터 기본 조합을 쓴다.
 */
export function selectMissionIds(
  date: string,
  count: number = DAILY_MISSION_COUNT,
): MissionId[] {
  const size = Math.min(count, MISSION_POOL.length);
  if (date === "") return MISSION_POOL.slice(0, size).map((def) => def.id);

  const rng = mulberry32(hashSeed(`match-picture-missions-${date}`));
  const pool = MISSION_POOL.map((def) => def.id);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, size);
}

export interface MissionState {
  progress: number;
  claimed: boolean;
}

export interface DailyMissions {
  /** KST 기준 날짜(YYYY-MM-DD). 이 날짜가 오늘과 다르면 리셋된다. */
  date: string;
  /** 그날 선택된 미션 id 목록. */
  ids: MissionId[];
  states: Partial<Record<MissionId, MissionState>>;
}

export function createDailyMissions(date: string): DailyMissions {
  const ids = selectMissionIds(date);
  const states: Partial<Record<MissionId, MissionState>> = {};
  for (const id of ids) {
    states[id] = { progress: 0, claimed: false };
  }
  return { date, ids, states };
}

/** 저장된 임의 입력을 안전한 DailyMissions로 정규화한다. */
export function normalizeDailyMissions(input: unknown): DailyMissions {
  // date를 빈 문자열로 두면 ensureToday가 첫 호출에서 리셋한다.
  const fallback = createDailyMissions("");
  if (input == null || typeof input !== "object") return fallback;
  const raw = input as Record<string, unknown>;
  const date = typeof raw.date === "string" ? raw.date : "";

  const rawIds = Array.isArray(raw.ids) ? raw.ids.filter(isMissionId) : [];
  // 구버전 저장본에는 ids가 없다. 날짜에서 결정적으로 다시 뽑는다.
  const ids = rawIds.length > 0 ? Array.from(new Set(rawIds)) : selectMissionIds(date);

  const rawStates =
    raw.states && typeof raw.states === "object"
      ? (raw.states as Record<string, unknown>)
      : {};

  const states: Partial<Record<MissionId, MissionState>> = {};
  for (const id of ids) {
    const def = missionDef(id);
    const s = rawStates[id] as Record<string, unknown> | undefined;
    const progress =
      s && typeof s.progress === "number" && Number.isFinite(s.progress)
        ? Math.max(0, Math.min(def.target, Math.floor(s.progress)))
        : 0;
    const claimed = s?.claimed === true;
    states[id] = { progress, claimed };
  }
  return { date, ids, states };
}

/** 날짜가 바뀌었으면 새 미션 조합으로 리셋한다. */
export function ensureToday(dm: DailyMissions, today: string): DailyMissions {
  return dm.date === today ? dm : createDailyMissions(today);
}

export function missionState(dm: DailyMissions, id: MissionId): MissionState {
  return dm.states[id] ?? { progress: 0, claimed: false };
}

export interface ClearInfo {
  seconds: number;
  mode: GameMode;
  maxCombo: number;
  wrongCount: number;
}

/** 클리어 결과가 해당 미션의 조건을 만족하는지. */
function satisfies(id: MissionId, info: ClearInfo): boolean {
  switch (id) {
    case "play3":
    case "play5":
      return true;
    case "fastClear":
      return info.seconds <= FAST_CLEAR_THRESHOLD_SECONDS;
    case "comboMaster":
      return info.maxCombo >= COMBO_MASTER_THRESHOLD;
    case "daily":
      return info.mode === "daily";
    case "noMistake":
      return info.wrongCount === 0;
  }
}

/**
 * 게임 클리어 이벤트로 미션 진행도를 갱신한다.
 * 이미 수령(claimed)했거나 target에 도달한 미션은 더 올리지 않는다.
 */
export function applyClear(dm: DailyMissions, info: ClearInfo): DailyMissions {
  const states: Partial<Record<MissionId, MissionState>> = { ...dm.states };

  for (const id of dm.ids) {
    if (!satisfies(id, info)) continue;
    const def = missionDef(id);
    const current = missionState(dm, id);
    if (current.claimed) continue;
    states[id] = {
      ...current,
      progress: Math.min(def.target, current.progress + 1),
    };
  }

  return { ...dm, states };
}

export function isComplete(dm: DailyMissions, id: MissionId): boolean {
  return missionState(dm, id).progress >= missionDef(id).target;
}

export function canClaim(dm: DailyMissions, id: MissionId): boolean {
  return (
    dm.ids.includes(id) && isComplete(dm, id) && !missionState(dm, id).claimed
  );
}

export interface ClaimResult {
  missions: DailyMissions;
  reward: number;
}

/** 완료했고 아직 안 받은 미션의 보상을 수령한다. */
export function claim(dm: DailyMissions, id: MissionId): ClaimResult {
  if (!canClaim(dm, id)) return { missions: dm, reward: 0 };
  return {
    missions: {
      ...dm,
      states: {
        ...dm.states,
        [id]: { ...missionState(dm, id), claimed: true },
      },
    },
    reward: missionDef(id).reward,
  };
}
