/**
 * 식물 도감(매니페스트). 심볼팩(symbols/packs.ts)과 같은 철학:
 * 새 식물을 추가하려면 아래 배열에 항목 하나만 늘리면 된다(기계적, 충돌 없음).
 * id 중복/잘못된 단계 구성은 validatePlantSpecies가 dev 빌드에서 즉시 throw로 잡는다.
 */

export interface PlantSpecies {
  id: string;
  /** 표시 이름은 i18n 사전의 plant.<id>.name 키에 있다. */
  /** 성장 단계별 이모지. [0]=갓 심은 모습 … [last]=다 자란 모습. 최소 2단계. */
  stages: string[];
  /** 한 단계 성장에 필요한 물 횟수. */
  waterPerStage: number;
  /** 씨앗 가격(코인). 0이면 무료(스타터). */
  seedPrice: number;
  /** 다 자랐을 때 지급하는 1회 보상 코인. */
  reward: number;
}

export const PLANT_SPECIES: PlantSpecies[] = [
  {
    id: "sprout",
    stages: ["🌱", "🌿", "🌼"],
    waterPerStage: 2,
    seedPrice: 0,
    reward: 50,
  },
  {
    id: "cactus",
    stages: ["🌱", "🌵"],
    waterPerStage: 3,
    seedPrice: 120,
    reward: 170,
  },
  {
    id: "sunflower",
    stages: ["🌱", "🌿", "🌻"],
    waterPerStage: 3,
    seedPrice: 120,
    reward: 180,
  },
  {
    id: "rose",
    stages: ["🌱", "🌿", "🌹"],
    waterPerStage: 4,
    seedPrice: 200,
    reward: 300,
  },
  {
    id: "tree",
    stages: ["🌱", "🌿", "🌳"],
    waterPerStage: 4,
    seedPrice: 280,
    reward: 420,
  },
  {
    id: "palm",
    stages: ["🌱", "🌿", "🌴"],
    waterPerStage: 5,
    seedPrice: 350,
    reward: 520,
  },
];

const FALLBACK_SPECIES = PLANT_SPECIES[0];

export function getSpecies(id: string | null | undefined): PlantSpecies {
  return PLANT_SPECIES.find((s) => s.id === id) ?? FALLBACK_SPECIES;
}

/** 다 자란 단계의 인덱스(= stages.length - 1). */
export function maxStageIndex(species: PlantSpecies): number {
  return species.stages.length - 1;
}

/** 매니페스트 무결성 검증: id 중복, 단계 부족, 잘못된 수치를 잡는다. */
export function validatePlantSpecies(list: PlantSpecies[] = PLANT_SPECIES): void {
  const seen = new Set<string>();
  for (const s of list) {
    if (!s.id) throw new Error("PlantSpecies에 빈 id가 있습니다.");
    if (seen.has(s.id)) throw new Error(`PlantSpecies id 중복: "${s.id}"`);
    seen.add(s.id);
    if (!Array.isArray(s.stages) || s.stages.length < 2) {
      throw new Error(`PlantSpecies "${s.id}"는 최소 2단계가 필요합니다.`);
    }
    if (!Number.isInteger(s.waterPerStage) || s.waterPerStage < 1) {
      throw new Error(`PlantSpecies "${s.id}"의 waterPerStage가 올바르지 않습니다.`);
    }
    if (s.seedPrice < 0 || s.reward < 0) {
      throw new Error(`PlantSpecies "${s.id}"의 가격/보상이 음수입니다.`);
    }
  }
}

if (import.meta.env.DEV) {
  validatePlantSpecies();
}
