/**
 * 스테이지 진행(맵 + 별점) 데이터와 순수 로직입니다.
 *
 * 밸런스 수치는 전부 아래 STAGES 한 곳에 있으므로 조정할 때 다른 코드를 건드릴 필요가 없습니다.
 */

import type { DifficultyId } from "./difficulty";
import { hashSeed } from "./rng";

export interface StageDef {
  /** 1부터 시작하는 스테이지 번호. */
  id: number;
  difficulty: DifficultyId;
  /** 이 스테이지의 라운드 수. */
  totalCards: number;
  /** 이 시간 안에 끝내면 별 2개. */
  twoStarSeconds: number;
  /** 이 시간 안에 + 오답 허용치 이하이면 별 3개. */
  threeStarSeconds: number;
  threeStarMaxWrong: number;
  /** 별 1개당 지급 코인. */
  coinPerStar: number;
}

export const STAGES: StageDef[] = [
  { id: 1, difficulty: "easy", totalCards: 5, twoStarSeconds: 25, threeStarSeconds: 16, threeStarMaxWrong: 1, coinPerStar: 15 },
  { id: 2, difficulty: "easy", totalCards: 8, twoStarSeconds: 35, threeStarSeconds: 24, threeStarMaxWrong: 1, coinPerStar: 15 },
  { id: 3, difficulty: "normal", totalCards: 8, twoStarSeconds: 40, threeStarSeconds: 28, threeStarMaxWrong: 1, coinPerStar: 20 },
  { id: 4, difficulty: "normal", totalCards: 10, twoStarSeconds: 48, threeStarSeconds: 34, threeStarMaxWrong: 1, coinPerStar: 20 },
  { id: 5, difficulty: "normal", totalCards: 12, twoStarSeconds: 58, threeStarSeconds: 40, threeStarMaxWrong: 0, coinPerStar: 25 },
  { id: 6, difficulty: "hard", totalCards: 12, twoStarSeconds: 62, threeStarSeconds: 44, threeStarMaxWrong: 0, coinPerStar: 30 },
  { id: 7, difficulty: "hard", totalCards: 14, twoStarSeconds: 72, threeStarSeconds: 52, threeStarMaxWrong: 0, coinPerStar: 30 },
  { id: 8, difficulty: "hard", totalCards: 16, twoStarSeconds: 84, threeStarSeconds: 60, threeStarMaxWrong: 0, coinPerStar: 40 },
];

export const STAGE_COUNT = STAGES.length;
export const MAX_STARS_PER_STAGE = 3;

/** 스테이지 덱 시드. 모든 사용자가 같은 스테이지에서 같은 덱을 만납니다. */
export function stageSeed(id: number): number {
  return hashSeed(`match-picture-stage-${id}`);
}

export function getStage(id: number): StageDef | null {
  return STAGES.find((stage) => stage.id === id) ?? null;
}

/** 스테이지 진행 상태: 스테이지 번호 → 획득한 최고 별 수. */
export type StageProgress = Record<string, number>;

export function normalizeStageProgress(input: unknown): StageProgress {
  const progress: StageProgress = {};
  if (input == null || typeof input !== "object") return progress;
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    const id = Number(key);
    if (!Number.isInteger(id) || getStage(id) === null) continue;
    if (typeof value !== "number" || !Number.isFinite(value)) continue;
    const stars = Math.max(0, Math.min(MAX_STARS_PER_STAGE, Math.floor(value)));
    if (stars > 0) progress[String(id)] = stars;
  }
  return progress;
}

export function starsForStage(progress: StageProgress, id: number): number {
  return progress[String(id)] ?? 0;
}

/** 앞 스테이지를 한 번이라도 클리어했으면 해금됩니다. */
export function isStageUnlocked(progress: StageProgress, id: number): boolean {
  if (getStage(id) === null) return false;
  if (id <= 1) return true;
  return starsForStage(progress, id - 1) > 0;
}

/** 다음에 도전할 스테이지(모두 클리어했으면 마지막 스테이지). */
export function nextStageId(progress: StageProgress): number {
  for (const stage of STAGES) {
    if (starsForStage(progress, stage.id) === 0) return stage.id;
  }
  return STAGES[STAGES.length - 1].id;
}

export function totalStars(progress: StageProgress): number {
  return STAGES.reduce((sum, stage) => sum + starsForStage(progress, stage.id), 0);
}

/** 클리어 결과로 별 개수를 매깁니다(클리어하면 최소 1개). */
export function evaluateStars(
  stage: StageDef,
  seconds: number,
  wrongCount: number,
): number {
  let stars = 1;
  if (seconds <= stage.twoStarSeconds) stars += 1;
  if (seconds <= stage.threeStarSeconds && wrongCount <= stage.threeStarMaxWrong) {
    stars += 1;
  }
  return Math.min(MAX_STARS_PER_STAGE, stars);
}

export interface StageClearResult {
  progress: StageProgress;
  stars: number;
  /** 이번에 새로 늘어난 별 수. */
  gainedStars: number;
  /** 새로 늘어난 별에 대해 지급할 코인. */
  coins: number;
  unlockedStageId: number | null;
}

/** 스테이지 클리어를 진행 상태에 반영합니다. 별은 최고 기록만 남습니다. */
export function applyStageClear(
  progress: StageProgress,
  id: number,
  seconds: number,
  wrongCount: number,
): StageClearResult {
  const stage = getStage(id);
  if (stage === null) {
    return { progress, stars: 0, gainedStars: 0, coins: 0, unlockedStageId: null };
  }

  const previousStars = starsForStage(progress, id);
  const stars = evaluateStars(stage, seconds, wrongCount);
  const bestStars = Math.max(previousStars, stars);
  const gainedStars = Math.max(0, bestStars - previousStars);
  const next: StageProgress = { ...progress, [String(id)]: bestStars };
  const unlockedStageId =
    previousStars === 0 && getStage(id + 1) !== null ? id + 1 : null;

  return {
    progress: next,
    stars,
    gainedStars,
    coins: gainedStars * stage.coinPerStar,
    unlockedStageId,
  };
}
