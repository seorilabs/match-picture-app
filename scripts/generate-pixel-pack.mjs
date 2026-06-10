/**
 * "픽셀" 심볼팩 생성기.
 *
 * 12x12 ASCII 그리드로 정의한 19개 모티프를 3가지 색 변형으로 렌더링해
 * Dobble 덱이 요구하는 57개 심볼 SVG를 public/symbols/pixel/에 출력합니다.
 *
 *   node scripts/generate-pixel-pack.mjs
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
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const GRID = 12;
const OUTLINE_COLOR = "#20242e";
const WHITE = "#ffffff";
const DARK = "#1a1a1a";

/** @typedef {{ name: string, primaries: [string, string, string], colors?: Record<string, string>, rows: string[] }} Motif */

/** @type {Motif[]} */
const MOTIFS = [
  {
    name: "heart",
    primaries: ["#e8284b", "#3f7cff", "#ffc93e"],
    rows: [
      "............",
      "..PP....PP..",
      ".PWWP..PPPP.",
      "PPPPPPPPPPPP",
      "PPPPPPPPPPPP",
      "PPPPPPPPPPPP",
      ".PPPPPPPPPP.",
      "..PPPPPPPP..",
      "...PPPPPP...",
      "....PPPP....",
      ".....PP.....",
      "............",
    ],
  },
  {
    name: "star",
    primaries: ["#ffd23e", "#ff5e8a", "#4fd1ff"],
    rows: [
      ".....PP.....",
      ".....PP.....",
      "....PPPP....",
      "....PPPP....",
      "PPPPPPPPPPPP",
      ".PPPPPPPPPP.",
      "..PPPPPPPP..",
      "...PPPPPP...",
      "..PPPPPPPP..",
      "..PPP..PPP..",
      ".PPP....PPP.",
      "............",
    ],
  },
  {
    name: "moon",
    primaries: ["#f5d76e", "#b3e5ff", "#c9a0ff"],
    rows: [
      "....PPPP....",
      "...PPPP.....",
      "..PPPP......",
      ".PPPP.......",
      ".PPPP.......",
      ".PPPP.......",
      ".PPPP.......",
      ".PPPP.......",
      "..PPPP......",
      "...PPPP.....",
      "....PPPP....",
      "............",
    ],
  },
  {
    name: "sun",
    primaries: ["#ffae00", "#ff5e5e", "#ffe14d"],
    rows: [
      ".....PP.....",
      ".P...PP...P.",
      "..P.PPPP.P..",
      "...PPPPPP...",
      "..PPPPPPPP..",
      "P.PPPPPPPP.P",
      "P.PPPPPPPP.P",
      "..PPPPPPPP..",
      "...PPPPPP...",
      "..P.PPPP.P..",
      ".P...PP...P.",
      ".....PP.....",
    ],
  },
  {
    name: "bolt",
    primaries: ["#ffe14d", "#7cf5ff", "#ff9d2e"],
    rows: [
      "....PPPPP...",
      "...PPPP.....",
      "..PPPP......",
      ".PPPPPPPP...",
      "...PPPP.....",
      "..PPPP......",
      ".PPPP.......",
      ".PPP........",
      ".PP.........",
      ".P..........",
      "............",
      "............",
    ],
  },
  {
    name: "skull",
    primaries: ["#f2efe4", "#c9f5d2", "#f5c9e8"],
    rows: [
      "...PPPPPP...",
      "..PPPPPPPP..",
      ".PPPPPPPPPP.",
      ".PP##PP##PP.",
      ".PP##PP##PP.",
      ".PPPPPPPPPP.",
      "..PPP##PPP..",
      "..PPPPPPPP..",
      "...P#P#P#...",
      "...PPPPPP...",
      "............",
      "............",
    ],
  },
  {
    name: "ghost",
    primaries: ["#eef3ff", "#d2f5dc", "#ffd9ec"],
    rows: [
      "...PPPPPP...",
      "..PPPPPPPP..",
      ".PPPPPPPPPP.",
      ".PP##PP##PP.",
      ".PP##PP##PP.",
      ".PPPPPPPPPP.",
      ".PPPPPPPPPP.",
      ".PPPPPPPPPP.",
      ".PPPPPPPPPP.",
      ".PPPPPPPPPP.",
      ".PP.PPP.PP..",
      "............",
    ],
  },
  {
    name: "sword",
    primaries: ["#d7e3f0", "#ffd23e", "#9ef5b0"],
    colors: { S: "#8a5a2b" },
    rows: [
      ".....PP.....",
      ".....PP.....",
      ".....PP.....",
      ".....PP.....",
      ".....PP.....",
      ".....PP.....",
      ".....PP.....",
      "..SSSSSSSS..",
      ".....SS.....",
      ".....SS.....",
      "....SSSS....",
      "............",
    ],
  },
  {
    name: "shield",
    primaries: ["#d94f4f", "#3f7cff", "#4caf50"],
    colors: { S: "#ffd23e" },
    rows: [
      ".PPPPSSPPPP.",
      ".PPPPSSPPPP.",
      ".PPPPSSPPPP.",
      ".PPPPSSPPPP.",
      ".PPPPSSPPPP.",
      ".PPPPSSPPPP.",
      "..PPPSSPPP..",
      "..PPPSSPPP..",
      "...PPSSPP...",
      "....PSSP....",
      ".....SS.....",
      "............",
    ],
  },
  {
    name: "key",
    primaries: ["#ffc93e", "#c0c8d8", "#ff8a5e"],
    rows: [
      "...PPPP.....",
      "..PP..PP....",
      "..PP..PP....",
      "...PPPP.....",
      ".....PP.....",
      ".....PP.....",
      ".....PP.....",
      ".....PPPP...",
      ".....PP.....",
      ".....PPPP...",
      ".....PP.....",
      "............",
    ],
  },
  {
    name: "crown",
    primaries: ["#ffc93e", "#e8e8f0", "#ff7eb3"],
    colors: { S: "#e8284b" },
    rows: [
      "............",
      ".PP..PP..PP.",
      ".PP..PP..PP.",
      ".PPP.PP.PPP.",
      ".PPPPPPPPPP.",
      ".PPPPPPPPPP.",
      ".PPSPPSPPSP.",
      ".PPPPPPPPPP.",
      "............",
      "............",
      "............",
      "............",
    ],
  },
  {
    name: "coin",
    primaries: ["#ffc93e", "#c0c8d8", "#ff9d2e"],
    colors: { S: "#6b4e0e" },
    rows: [
      "...PPPPPP...",
      "..PPPPPPPP..",
      ".PPPPSSPPPP.",
      ".PPPSSSSPPP.",
      ".PPPSS..PPP.",
      ".PPPPSSPPPP.",
      ".PPP..SSPPP.",
      ".PPPSSSSPPP.",
      ".PPPPSSPPPP.",
      "..PPPPPPPP..",
      "...PPPPPP...",
      "............",
    ],
  },
  {
    name: "diamond",
    primaries: ["#6ee0ff", "#ff8ad8", "#b0ff7e"],
    rows: [
      "............",
      "..PPPPPPPP..",
      ".PPWPPPPPPP.",
      "PPPPPPPPPPPP",
      ".PPPPPPPPPP.",
      "..PPPPPPPP..",
      "...PPPPPP...",
      "....PPPP....",
      ".....PP.....",
      "............",
      "............",
      "............",
    ],
  },
  {
    name: "potion",
    primaries: ["#b04fff", "#4fff8a", "#ff4f6e"],
    colors: { S: "#8a5a2b" },
    rows: [
      "....SSSS....",
      ".....SS.....",
      ".....SS.....",
      "....PPPP....",
      "...PPPPPP...",
      "..PPPPPPPP..",
      "..PPPPPPPP..",
      "..PPWPPPPP..",
      "..PPPPPPPP..",
      "...PPPPPP...",
      "............",
      "............",
    ],
  },
  {
    name: "mushroom",
    primaries: ["#e8284b", "#3f7cff", "#ffae00"],
    colors: { S: "#f5e9c9" },
    rows: [
      "....PPPP....",
      "..PPPPPPPP..",
      ".PPWWPPPPPP.",
      ".PPPPPPWWPP.",
      ".PPPPPPPPPP.",
      "....SSSS....",
      "....SSSS....",
      "....SSSS....",
      "...SSSSSS...",
      "............",
      "............",
      "............",
    ],
  },
  {
    name: "cherry",
    primaries: ["#e8284b", "#ffc93e", "#8a4fff"],
    colors: { S: "#4caf50" },
    rows: [
      "......SS....",
      ".....SS.....",
      "....SS......",
      "...SS.SS....",
      "..SS....SS..",
      ".PPP....PPP.",
      "PPPPP..PPPPP",
      "PPPPP..PPPPP",
      "PWPPP..PWPPP",
      ".PPP....PPP.",
      "............",
      "............",
    ],
  },
  {
    name: "fish",
    primaries: ["#ff9d2e", "#4fa8ff", "#8ae85e"],
    rows: [
      "............",
      "...PPPPP....",
      "..PPPPPPP...",
      ".P#PPPPPP.PP",
      ".PPPPPPPPPPP",
      "..PPPPPPP.PP",
      "...PPPPP....",
      "............",
      "............",
      "............",
      "............",
      "............",
    ],
  },
  {
    name: "rocket",
    primaries: ["#d94f4f", "#4f7cd9", "#8a8f9e"],
    colors: { S: "#5a6270", F: "#ff9d2e" },
    rows: [
      ".....PP.....",
      "....PPPP....",
      "....PPPP....",
      "....PWWP....",
      "....PWWP....",
      "....PPPP....",
      "...SPPPPS...",
      "..SSPPPPSS..",
      "..S.PPPP.S..",
      "....FFFF....",
      ".....FF.....",
      "............",
    ],
  },
  {
    name: "controller",
    primaries: ["#5a6270", "#d94f4f", "#4f7cd9"],
    colors: { S: "#ffd23e" },
    rows: [
      "............",
      ".PPPPPPPPPP.",
      "PPPPPPPPPPPP",
      "PP#PPPPPPSPP",
      "P###PPPPSPSP",
      "PP#PPPPPPSPP",
      "PPPPPPPPPPPP",
      ".PPP....PPP.",
      "............",
      "............",
      "............",
      "............",
    ],
  },
];

const VARIANTS_PER_MOTIF = 3;
const TOTAL_SYMBOLS = MOTIFS.length * VARIANTS_PER_MOTIF;

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

function main() {
  MOTIFS.forEach(validateMotif);
  if (TOTAL_SYMBOLS < 57) {
    throw new Error(`심볼이 ${TOTAL_SYMBOLS}개뿐입니다. 57개 이상 필요합니다.`);
  }

  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const outDir = resolve(scriptDir, "../public/symbols/pixel");
  mkdirSync(outDir, { recursive: true });

  for (let i = 1; i <= 57; i++) {
    const motif = MOTIFS[(i - 1) % MOTIFS.length];
    const variant = Math.floor((i - 1) / MOTIFS.length);
    const fileName = `${String(i).padStart(3, "0")}.svg`;
    writeFileSync(resolve(outDir, fileName), toSvg(motif, variant));
  }

  console.log(
    `픽셀 팩 생성 완료: ${MOTIFS.length} 모티프 x ${VARIANTS_PER_MOTIF} 변형 -> 57개 SVG (${outDir})`,
  );
}

main();
