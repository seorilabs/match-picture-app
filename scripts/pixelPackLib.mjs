/**
 * 픽셀 아트 심볼팩 공용 생성 라이브러리.
 *
 * 12x12 ASCII 그리드로 정의한 모티프 목록을 색 변형과 조합해
 * Dobble 덱이 요구하는 57개 심볼 SVG로 출력합니다.
 * 팩별 모티프 정의는 scripts/generate-<pack>-pack.mjs에 둡니다.
 *
 * 그리드 문자:
 *   .  투명
 *   P  변형별 기본색 (motif.primaries[variant])
 *   S  모티프 고정 보조색
 *   W  흰색 하이라이트
 *   #  모티프 고정 진한색 (눈/마크 등)
 *   F  모티프 고정 추가색 (불꽃 등)
 *
 * 모든 채움 픽셀 둘레에 자동으로 외곽선을 둘러 어떤 색이든
 * 밝은 카드 배경 위에서 시인성이 유지되게 합니다.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const GRID = 12;
const OUTLINE_COLOR = "#20242e";
const WHITE = "#ffffff";
const DARK = "#1a1a1a";

export const VARIANTS_PER_MOTIF = 3;
export const DECK_SYMBOL_COUNT = 57;

/** @typedef {{ name: string, primaries: [string, string, string], colors?: Record<string, string>, rows: string[] }} Motif */

function validateMotif(motif) {
  if (motif.rows.length !== GRID) {
    throw new Error(`${motif.name}: 행 수가 ${motif.rows.length} (${GRID} 필요)`);
  }
  motif.rows.forEach((row, index) => {
    if (row.length !== GRID) {
      throw new Error(
        `${motif.name} row ${index}: 길이 ${row.length} (${GRID} 필요): "${row}"`,
      );
    }
    for (const ch of row) {
      if (!".PSW#F".includes(ch)) {
        throw new Error(`${motif.name} row ${index}: 알 수 없는 문자 "${ch}"`);
      }
      if ((ch === "S" || ch === "F") && !motif.colors?.[ch]) {
        throw new Error(`${motif.name}: "${ch}" 색이 정의되지 않음`);
      }
    }
  });
  const unique = new Set(motif.primaries);
  if (unique.size !== VARIANTS_PER_MOTIF) {
    throw new Error(`${motif.name}: primaries에 중복 색이 있음`);
  }
}

function cellColor(ch, motif, variant) {
  if (ch === "P") return motif.primaries[variant];
  if (ch === "W") return WHITE;
  if (ch === "#") return DARK;
  return motif.colors?.[ch] ?? null;
}

/**
 * 채움 픽셀의 4방향 이웃 중 빈 칸을 외곽선으로 채웁니다.
 * 그리드를 14x14로 한 칸씩 확장해 가장자리 모티프도 외곽선을 갖게 합니다.
 */
function buildPixels(motif, variant) {
  const size = GRID + 2;
  const colors = Array.from({ length: size }, () => Array(size).fill(null));

  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      const ch = motif.rows[y][x];
      if (ch === ".") continue;
      colors[y + 1][x + 1] = cellColor(ch, motif, variant);
    }
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (colors[y][x] !== null) continue;
      const filledNeighbor = [
        [y - 1, x],
        [y + 1, x],
        [y, x - 1],
        [y, x + 1],
      ].some(
        ([ny, nx]) =>
          ny >= 0 &&
          ny < size &&
          nx >= 0 &&
          nx < size &&
          colors[ny][nx] !== null &&
          colors[ny][nx] !== OUTLINE_COLOR,
      );
      if (filledNeighbor) colors[y][x] = OUTLINE_COLOR;
    }
  }

  return { colors, size };
}

/** 같은 색 가로 연속 픽셀을 rect 하나로 합쳐 SVG 크기를 줄입니다. */
function toSvg(motif, variant) {
  const { colors, size } = buildPixels(motif, variant);
  const rects = [];
  for (let y = 0; y < size; y++) {
    let x = 0;
    while (x < size) {
      const color = colors[y][x];
      if (color === null) {
        x++;
        continue;
      }
      let width = 1;
      while (x + width < size && colors[y][x + width] === color) width++;
      rects.push(
        `<rect x="${x}" y="${y}" width="${width}" height="1" fill="${color}"/>`,
      );
      x += width;
    }
  }
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges">`,
    ...rects,
    "</svg>",
    "",
  ].join("\n");
}

/**
 * 모티프 x 변형 조합으로 57개 SVG를 outDir에 출력합니다.
 * 심볼 i는 모티프 (i-1) % motifs.length, 변형 floor((i-1)/motifs.length)입니다.
 */
export function generatePixelPack({ packName, motifs, outDir }) {
  motifs.forEach(validateMotif);
  const totalSymbols = motifs.length * VARIANTS_PER_MOTIF;
  if (totalSymbols < DECK_SYMBOL_COUNT) {
    throw new Error(
      `${packName}: 심볼이 ${totalSymbols}개뿐입니다. ${DECK_SYMBOL_COUNT}개 이상 필요합니다.`,
    );
  }

  mkdirSync(outDir, { recursive: true });

  for (let i = 1; i <= DECK_SYMBOL_COUNT; i++) {
    const motif = motifs[(i - 1) % motifs.length];
    const variant = Math.floor((i - 1) / motifs.length);
    const fileName = `${String(i).padStart(3, "0")}.svg`;
    writeFileSync(resolve(outDir, fileName), toSvg(motif, variant));
  }

  console.log(
    `${packName} 팩 생성 완료: ${motifs.length} 모티프 x ${VARIANTS_PER_MOTIF} 변형 -> ${DECK_SYMBOL_COUNT}개 SVG (${outDir})`,
  );
}
