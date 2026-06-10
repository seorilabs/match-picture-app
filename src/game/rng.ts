/**
 * 시드 기반 결정적 RNG 모듈입니다.
 *
 * 데일리 챌린지("오늘의 덱")와 도전장 링크(같은 덱으로 대결)는 모든 사용자가
 * 동일한 카드 순서를 받아야 하므로, `Math.random` 대신 시드에서 결정적으로
 * 난수열을 만드는 mulberry32를 사용합니다.
 */

import type { Rng } from "./deck";

/** 32비트 부호 없는 정수 시드의 최댓값입니다. */
export const MAX_SEED = 0xffffffff;

/**
 * 문자열을 32비트 시드로 해시합니다 (FNV-1a).
 * 같은 입력은 항상 같은 시드를 반환하므로 날짜 문자열 기반 데일리 시드에 사용합니다.
 */
export function hashSeed(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * mulberry32 PRNG. 시드 하나로 [0, 1) 범위의 결정적 난수열을 만듭니다.
 * Deck 셔플 용도로는 충분한 품질이며 의존성 없이 5줄로 끝나는 것이 장점입니다.
 */
export function mulberry32(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
  };
}

/** 클래식 모드처럼 매판 새 덱이 필요할 때 쓰는 무작위 시드입니다. */
export function randomSeed(): number {
  return Math.floor(Math.random() * (MAX_SEED + 1));
}
