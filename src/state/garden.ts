/**
 * 정원 메타: 매일 물주기로 식물을 키우고, 다 자라면 코인 보상 + 도감 수집.
 * 순수 로직만 담는다. 코인 차감/지급은 ProfileProvider가 보상액을 받아 처리한다.
 */
import {
  PLANT_SPECIES,
  getSpecies,
  maxStageIndex,
  type PlantSpecies,
} from "../garden/species";

/** 정원 화분 수. */
export const GARDEN_PLOTS = 3;

/** 비료 1회 가격(코인). 물 +1 즉시. 풀-가속해도 약손해가 되도록 책정. */
export const FERTILIZER_COST = 60;

export interface GardenPlant {
  speciesId: string;
  /** 현재 성장 단계 인덱스. */
  stage: number;
  /** 다음 단계까지 누적된 물. */
  water: number;
}

export interface Garden {
  /** 마지막 데일리 물주기 리셋 날짜(KST YYYY-MM-DD). */
  date: string;
  /** 오늘 무료 물주기를 썼는지. */
  wateredToday: boolean;
  /** 화분 슬롯(비어 있으면 null). */
  plots: (GardenPlant | null)[];
  /** 다 키워본 식물 종 id(도감). */
  collected: string[];
}

export function createGarden(): Garden {
  const plots: (GardenPlant | null)[] = Array(GARDEN_PLOTS).fill(null);
  // 첫 화분에는 무료 스타터(새싹)를 미리 심어 홈이 비어 보이지 않게 한다.
  plots[0] = { speciesId: PLANT_SPECIES[0].id, stage: 0, water: 0 };
  return { date: "", wateredToday: false, plots, collected: [] };
}

function normalizePlant(input: unknown): GardenPlant | null {
  if (input == null || typeof input !== "object") return null;
  const raw = input as Record<string, unknown>;
  if (typeof raw.speciesId !== "string") return null;
  const species = PLANT_SPECIES.find((s) => s.id === raw.speciesId);
  if (!species) return null;
  const max = maxStageIndex(species);
  const stage =
    typeof raw.stage === "number" && Number.isFinite(raw.stage)
      ? Math.max(0, Math.min(max, Math.floor(raw.stage)))
      : 0;
  const water =
    typeof raw.water === "number" && Number.isFinite(raw.water)
      ? Math.max(0, Math.floor(raw.water))
      : 0;
  return { speciesId: species.id, stage, water };
}

export function normalizeGarden(input: unknown): Garden {
  if (input == null || typeof input !== "object") return createGarden();
  const raw = input as Record<string, unknown>;
  const date = typeof raw.date === "string" ? raw.date : "";
  const wateredToday = raw.wateredToday === true;

  const rawPlots = Array.isArray(raw.plots) ? raw.plots : [];
  const plots: (GardenPlant | null)[] = Array(GARDEN_PLOTS)
    .fill(null)
    .map((_, i) => normalizePlant(rawPlots[i]));

  const collected = Array.isArray(raw.collected)
    ? Array.from(
        new Set(
          raw.collected.filter(
            (id): id is string =>
              typeof id === "string" &&
              PLANT_SPECIES.some((s) => s.id === id),
          ),
        ),
      )
    : [];

  return { date, wateredToday, plots, collected };
}

/** 날짜가 바뀌었으면 오늘 물주기를 다시 쓸 수 있게 한다. */
export function ensureDailyReset(garden: Garden, today: string): Garden {
  if (garden.date === today) return garden;
  return { ...garden, date: today, wateredToday: false };
}

export function isMature(plant: GardenPlant, species: PlantSpecies): boolean {
  return plant.stage >= maxStageIndex(species);
}

export function plantStageEmoji(plant: GardenPlant): string {
  const species = getSpecies(plant.speciesId);
  return species.stages[Math.min(plant.stage, maxStageIndex(species))];
}

/** 다음 단계까지 남은 물(다 자랐으면 0). */
export function waterToNextStage(plant: GardenPlant): number {
  const species = getSpecies(plant.speciesId);
  if (isMature(plant, species)) return 0;
  return Math.max(0, species.waterPerStage - plant.water);
}

interface ResolveResult {
  plant: GardenPlant;
  /** 이번 처리로 처음 다 자랐으면 true. */
  matured: boolean;
}

/** 누적 물에 따라 단계를 올린다. 이번에 처음 max 단계에 도달하면 matured=true. */
function resolvePlant(plant: GardenPlant): ResolveResult {
  const species = getSpecies(plant.speciesId);
  const max = maxStageIndex(species);
  const wasMature = plant.stage >= max;

  let { stage, water } = plant;
  while (water >= species.waterPerStage && stage < max) {
    stage += 1;
    water -= species.waterPerStage;
  }
  if (stage >= max) water = 0;

  return {
    plant: { ...plant, stage, water },
    matured: !wasMature && stage >= max,
  };
}

export interface WaterResult {
  garden: Garden;
  /** 이번 물주기로 다 자란 식물들의 보상 합. */
  reward: number;
  /** 새로 다 자란 식물 수(피드백용). */
  matured: number;
}

/**
 * 무료 데일리 물주기: 다 자라지 않은 모든 화분에 물 +1.
 * 이미 오늘 물을 줬으면 아무 일도 하지 않는다.
 */
export function waterAll(garden: Garden): WaterResult {
  if (garden.wateredToday) return { garden, reward: 0, matured: 0 };

  let reward = 0;
  let matured = 0;
  const collected = new Set(garden.collected);

  const plots = garden.plots.map((plant) => {
    if (plant === null) return null;
    const species = getSpecies(plant.speciesId);
    if (isMature(plant, species)) return plant;
    const resolved = resolvePlant({ ...plant, water: plant.water + 1 });
    if (resolved.matured) {
      reward += species.reward;
      matured += 1;
      collected.add(species.id);
    }
    return resolved.plant;
  });

  return {
    garden: {
      ...garden,
      wateredToday: true,
      plots,
      collected: Array.from(collected),
    },
    reward,
    matured,
  };
}

export interface FertilizeResult {
  garden: Garden;
  /** 비료로 다 자랐으면 그 보상, 아니면 0. */
  reward: number;
  matured: boolean;
  /** 적용됐는지(빈/다 자란 화분이면 false). */
  applied: boolean;
}

/** 특정 화분에 물 +1 즉시(비료). 코인 차감은 호출부에서. */
export function fertilize(garden: Garden, plotIndex: number): FertilizeResult {
  const plant = garden.plots[plotIndex];
  if (!plant) return { garden, reward: 0, matured: false, applied: false };
  const species = getSpecies(plant.speciesId);
  if (isMature(plant, species)) {
    return { garden, reward: 0, matured: false, applied: false };
  }

  const resolved = resolvePlant({ ...plant, water: plant.water + 1 });
  const collected = new Set(garden.collected);
  let reward = 0;
  if (resolved.matured) {
    reward = species.reward;
    collected.add(species.id);
  }

  const plots = [...garden.plots];
  plots[plotIndex] = resolved.plant;
  return {
    garden: { ...garden, plots, collected: Array.from(collected) },
    reward,
    matured: resolved.matured,
    applied: true,
  };
}

export function hasEmptyPlot(garden: Garden): boolean {
  return garden.plots.some((plant) => plant === null);
}

export type PlantSeedReason = "no-empty-plot" | "unknown-species";

export interface PlantSeedResult {
  ok: boolean;
  garden: Garden;
  reason?: PlantSeedReason;
}

/** 빈 화분에 새 씨앗을 심는다(코인 차감은 호출부에서). */
export function plantSeed(garden: Garden, speciesId: string): PlantSeedResult {
  if (!PLANT_SPECIES.some((s) => s.id === speciesId)) {
    return { ok: false, garden, reason: "unknown-species" };
  }
  const index = garden.plots.findIndex((plant) => plant === null);
  if (index === -1) return { ok: false, garden, reason: "no-empty-plot" };

  const plots = [...garden.plots];
  plots[index] = { speciesId, stage: 0, water: 0 };
  return { ok: true, garden: { ...garden, plots } };
}

/** 화분을 비운다(다 자란 식물을 치우고 새로 심을 자리 확보). */
export function removePlant(garden: Garden, plotIndex: number): Garden {
  if (plotIndex < 0 || plotIndex >= garden.plots.length) return garden;
  if (garden.plots[plotIndex] === null) return garden;
  const plots = [...garden.plots];
  plots[plotIndex] = null;
  return { ...garden, plots };
}
