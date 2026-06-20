/**
 * 데일리 미션: 매일(KST) 갱신되는 목표와 보상. 순수 로직만 담는다.
 * 진행도 갱신/보상 수령은 ProfileProvider가 호출하고, 보상 코인은 프로필 지갑에 더해진다.
 */
import type { GameMode } from "../game/mode";

export type MissionId = "play3" | "fastClear" | "daily";

export interface MissionDef {
  id: MissionId;
  reward: number;
  target: number;
}

/** "빠른 클리어" 미션 인정 기준(초). */
export const FAST_CLEAR_THRESHOLD_SECONDS = 15;

// 표시 라벨은 i18n 사전의 mission.<id>.label 키에 있다(fastClear는 {n}에 위 임계값).
export const MISSION_DEFS: MissionDef[] = [
  { id: "play3", reward: 30, target: 3 },
  { id: "fastClear", reward: 50, target: 1 },
  { id: "daily", reward: 40, target: 1 },
];

export function missionDef(id: MissionId): MissionDef {
  // MISSION_DEFS는 모든 MissionId를 포함하므로 항상 존재한다.
  return MISSION_DEFS.find((def) => def.id === id) as MissionDef;
}

export interface MissionState {
  progress: number;
  claimed: boolean;
}

export interface DailyMissions {
  /** KST 기준 날짜(YYYY-MM-DD). 이 날짜가 오늘과 다르면 리셋된다. */
  date: string;
  states: Record<MissionId, MissionState>;
}

export function createDailyMissions(date: string): DailyMissions {
  const states = {} as Record<MissionId, MissionState>;
  for (const def of MISSION_DEFS) {
    states[def.id] = { progress: 0, claimed: false };
  }
  return { date, states };
}

/** 저장된 임의 입력을 안전한 DailyMissions로 정규화한다. */
export function normalizeDailyMissions(input: unknown): DailyMissions {
  // date를 빈 문자열로 두면 ensureToday가 첫 호출에서 리셋한다.
  const fallback = createDailyMissions("");
  if (input == null || typeof input !== "object") return fallback;
  const raw = input as Record<string, unknown>;
  const date = typeof raw.date === "string" ? raw.date : "";
  const rawStates =
    raw.states && typeof raw.states === "object"
      ? (raw.states as Record<string, unknown>)
      : {};

  const states = {} as Record<MissionId, MissionState>;
  for (const def of MISSION_DEFS) {
    const s = rawStates[def.id] as Record<string, unknown> | undefined;
    const progress =
      s && typeof s.progress === "number" && Number.isFinite(s.progress)
        ? Math.max(0, Math.min(def.target, Math.floor(s.progress)))
        : 0;
    const claimed = s?.claimed === true;
    states[def.id] = { progress, claimed };
  }
  return { date, states };
}

/** 날짜가 바뀌었으면 새 미션으로 리셋한다. */
export function ensureToday(dm: DailyMissions, today: string): DailyMissions {
  return dm.date === today ? dm : createDailyMissions(today);
}

export interface ClearInfo {
  seconds: number;
  mode: GameMode;
}

/**
 * 게임 클리어 이벤트로 미션 진행도를 갱신한다.
 * 이미 수령(claimed)했거나 target에 도달한 미션은 더 올리지 않는다.
 */
export function applyClear(dm: DailyMissions, info: ClearInfo): DailyMissions {
  const states = { ...dm.states };
  const bump = (id: MissionId) => {
    const def = missionDef(id);
    const cur = states[id];
    if (cur.claimed) return;
    states[id] = { ...cur, progress: Math.min(def.target, cur.progress + 1) };
  };

  bump("play3");
  if (info.seconds <= FAST_CLEAR_THRESHOLD_SECONDS) bump("fastClear");
  if (info.mode === "daily") bump("daily");

  return { ...dm, states };
}

export function isComplete(dm: DailyMissions, id: MissionId): boolean {
  return dm.states[id].progress >= missionDef(id).target;
}

export function canClaim(dm: DailyMissions, id: MissionId): boolean {
  return isComplete(dm, id) && !dm.states[id].claimed;
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
      states: { ...dm.states, [id]: { ...dm.states[id], claimed: true } },
    },
    reward: missionDef(id).reward,
  };
}
