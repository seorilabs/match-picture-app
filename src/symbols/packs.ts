/**
 * 심볼팩(테마) 매니페스트입니다.
 *
 * 덱/룰 로직은 심볼을 "001"~"057" ID로만 다루고, 팩은 그 ID를 어떤 이미지로
 * 렌더링할지(디렉토리/확장자)만 결정합니다. 새 테마를 추가할 때는
 * 57개 에셋을 public 아래 디렉토리에 두고 여기 항목 하나만 늘리면 됩니다.
 */

export interface SymbolPack {
  id: string;
  /** 테마 선택 칩에 노출되는 이름. */
  label: string;
  /** public 기준 에셋 디렉토리. */
  dir: string;
  ext: "png" | "svg";
}

export const SYMBOL_PACKS: SymbolPack[] = [
  {
    id: "classic",
    label: "클래식",
    dir: "symbols",
    ext: "png",
  },
  {
    id: "pixel",
    label: "픽셀",
    dir: "symbols/pixel",
    ext: "svg",
  },
  {
    id: "space",
    label: "우주",
    dir: "symbols/space",
    ext: "svg",
  },
  {
    id: "instrument",
    label: "악기",
    dir: "symbols/instrument",
    ext: "svg",
  },
  {
    id: "ocean",
    label: "바다",
    dir: "symbols/ocean",
    ext: "svg",
  },
];

export const DEFAULT_PACK_ID = "classic";

export const SYMBOL_PACK_STORAGE_KEY = "match-picture/symbol-pack";

const DEFAULT_PACK =
  SYMBOL_PACKS.find((pack) => pack.id === DEFAULT_PACK_ID) ?? SYMBOL_PACKS[0];

/** 저장된 ID가 더 이상 없는 팩이면 기본 팩(클래식)으로 안전하게 돌아갑니다. */
export function getSymbolPack(id: string | null | undefined): SymbolPack {
  const pack = SYMBOL_PACKS.find((candidate) => candidate.id === id);
  return pack ?? DEFAULT_PACK;
}

/** 심볼 ID("001"~)를 선택된 팩의 이미지 URL로 변환합니다. */
export function symbolSrc(pack: SymbolPack, symbol: string): string {
  return `${import.meta.env.BASE_URL}${pack.dir}/${symbol}.${pack.ext}`;
}
