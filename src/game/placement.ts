/**
 * 카드 위 심볼 배치를 계산하는 순수 모듈입니다.
 *
 * - 난수를 주입받아 같은 시드는 항상 같은 배치를 만듭니다(데일리·도전장 공정성).
 * - 심볼 중심 사이에 최소 거리를 보장해 후반 라운드에서 버튼이 서로를 가리는
 *   오탭 불공정을 막습니다.
 */

import type { Card } from "./deck";
import type { Rng } from "./deck";
import { hashSeed, mulberry32 } from "./rng";

export interface Position {
  x: number;
  y: number;
}

export interface SymbolPlacement {
  symbol: string;
  rotate: number;
  scale: number;
  position: Position;
}

/** Unity Card.prefab 좌표계 한 변의 길이입니다. */
export const CARD_COORDINATE_SIZE = 650;

/** 심볼 버튼 한 변의 길이(App.css의 15.3846% × 650). */
export const SYMBOL_BASE_SIZE = 100;

/** 심볼 중심이 머물 수 있는 최대 반경. */
export const MAX_SYMBOL_RADIUS = 240;

/** 진행률 1일 때 축마다 흔드는 최대 거리. */
export const MAX_JITTER = 90;

/** 심볼 스케일 범위. 상한을 두어야 최소 간격 보장이 성립합니다. */
export const MIN_SYMBOL_SCALE = 0.85;
export const MAX_SYMBOL_SCALE = 1.25;

/**
 * 두 심볼이 겹쳤다고 보는 기준입니다. 반지름 합에 이 배수를 곱한 값이 최소 중심 거리입니다.
 * 이미지 여백을 고려해 1보다 약간 작게 둡니다.
 */
export const OVERLAP_TOLERANCE = 0.9;

/** 최소 간격을 만족할 때까지 위치를 다시 뽑아보는 최대 횟수입니다. */
export const MAX_PLACEMENT_ATTEMPTS = 12;

/** Unity 원본 Card.prefab의 8심볼 배치입니다. */
const UNITY_SYMBOL_POSITIONS: Position[] = [
  { x: -217, y: 58 },
  { x: 158, y: -93 },
  { x: 84, y: 220 },
  { x: -95, y: 215 },
  { x: 2, y: -224 },
  { x: -169, y: -116 },
  { x: -1, y: 26 },
  { x: 214, y: 70 },
];

/**
 * 심볼 수에 맞는 기본 배치를 만듭니다.
 * 8개는 Unity 원본 배치를 그대로 쓰고, 그 외에는 중앙 1 + 바깥 링 구성을 생성합니다.
 */
export function baseSymbolPositions(count: number): Position[] {
  if (count <= 0) return [];
  if (count === UNITY_SYMBOL_POSITIONS.length) {
    return UNITY_SYMBOL_POSITIONS.map((position) => ({ ...position }));
  }
  if (count === 1) return [{ x: 0, y: 0 }];

  const ringCount = count - 1;
  const positions: Position[] = [{ x: 0, y: 0 }];
  for (let i = 0; i < ringCount; i++) {
    const angle = (Math.PI * 2 * i) / ringCount;
    positions.push({
      x: Math.cos(angle) * MAX_SYMBOL_RADIUS,
      y: Math.sin(angle) * MAX_SYMBOL_RADIUS,
    });
  }
  return positions;
}

function symbolRadius(scale: number): number {
  return (SYMBOL_BASE_SIZE / 2) * scale;
}

/** 두 심볼이 겹치지 않기 위해 필요한 최소 중심 거리입니다. */
export function requiredDistance(scaleA: number, scaleB: number): number {
  return (symbolRadius(scaleA) + symbolRadius(scaleB)) * OVERLAP_TOLERANCE;
}

function clampToCard(position: Position): Position {
  const distance = Math.hypot(position.x, position.y);
  if (distance <= MAX_SYMBOL_RADIUS || distance === 0) return position;
  return {
    x: (position.x / distance) * MAX_SYMBOL_RADIUS,
    y: (position.y / distance) * MAX_SYMBOL_RADIUS,
  };
}

function jitterPosition(
  base: Position,
  range: number,
  rng: Rng,
): Position {
  if (range <= 0) return { ...base };
  return clampToCard({
    x: base.x + (rng() * 2 - 1) * range,
    y: base.y + (rng() * 2 - 1) * range,
  });
}

/** 이미 놓인 심볼들과의 여유 거리 중 최솟값. 음수면 겹친 것입니다. */
function clearance(
  candidate: Position,
  scale: number,
  placed: SymbolPlacement[],
): number {
  let worst = Number.POSITIVE_INFINITY;
  for (const other of placed) {
    const distance = Math.hypot(
      candidate.x - other.position.x,
      candidate.y - other.position.y,
    );
    worst = Math.min(worst, distance - requiredDistance(scale, other.scale));
  }
  return worst;
}

export interface ArrangeOptions {
  /** 게임 진행률(0~1). 클수록 기본 배치에서 멀리 흩뜨립니다. */
  progress?: number;
  /** 난이도별 흩뜨림 배수. */
  jitterScale?: number;
  /** 주입 난수. 같은 난수열은 항상 같은 배치를 만듭니다. */
  rng: Rng;
}

/**
 * 카드 심볼의 위치/회전/스케일을 결정합니다.
 * 최소 간격을 만족하지 못하면 다시 뽑고, 한도를 넘기면 기본 배치로 폴백해
 * 배치 생성이 실패하지 않게 합니다.
 */
export function arrangeSymbols(
  card: Card,
  { progress = 0, jitterScale = 1, rng }: ArrangeOptions,
): SymbolPlacement[] {
  const bases = baseSymbolPositions(card.length);
  const range = MAX_JITTER * Math.min(1, Math.max(0, progress)) * jitterScale;
  const placed: SymbolPlacement[] = [];

  card.forEach((symbol, index) => {
    const base = bases[index] ?? { x: 0, y: 0 };
    const rotate = rng() * 360 - 180;
    const scale =
      MIN_SYMBOL_SCALE + rng() * (MAX_SYMBOL_SCALE - MIN_SYMBOL_SCALE);

    let position = clampToCard({ ...base });
    if (range > 0) {
      // 최소 간격을 만족하는 첫 후보를 채택하고, 모두 실패하면
      // 기본 배치를 포함해 여유 거리가 가장 큰 위치로 되돌립니다.
      let accepted: Position | null = null;
      let fallback = position;
      let fallbackClearance = clearance(position, scale, placed);
      for (let attempt = 0; attempt < MAX_PLACEMENT_ATTEMPTS; attempt++) {
        const candidate = jitterPosition(base, range, rng);
        const candidateClearance = clearance(candidate, scale, placed);
        if (candidateClearance >= 0) {
          accepted = candidate;
          break;
        }
        if (candidateClearance > fallbackClearance) {
          fallback = candidate;
          fallbackClearance = candidateClearance;
        }
      }
      position = accepted ?? fallback;
    }

    placed.push({ symbol, rotate, scale, position });
  });

  return placed;
}

/**
 * 덱 시드와 카드 내용에서 배치 전용 시드를 만듭니다.
 * 같은 덱의 같은 카드는 라운드/위치가 달라져도 같은 배치를 유지합니다.
 */
export function placementSeed(deckSeed: number, card: Card): number {
  return hashSeed(`${deckSeed >>> 0}|${card.join(",")}`);
}

export function placementRng(deckSeed: number, card: Card): Rng {
  return mulberry32(placementSeed(deckSeed, card));
}
