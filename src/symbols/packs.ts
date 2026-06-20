/**
 * 심볼팩(테마) 매니페스트입니다.
 *
 * 덱/룰 로직은 심볼을 "001"~"057" ID로만 다루고, 팩은 그 ID를 어떤 이미지로
 * 렌더링할지(디렉토리/확장자)만 결정합니다.
 *
 * ── 새 팩 추가 체크리스트 (기계적, 충돌 없음) ───────────────────────────
 *  1. `public/<dir>/`에 001.<ext> ~ 057.<ext> (= SYMBOL_COUNT개) 에셋을 둔다.
 *  2. 아래 SYMBOL_PACKS 배열에 항목 하나를 추가한다. id는 유일해야 한다.
 *     (중복/누락은 validateSymbolPacks가 dev 빌드에서 즉시 throw로 잡는다.)
 *  3. 끝. 상점 미리보기/구매/장착·덱 렌더는 공유 ID 기반이라 추가 코드가 없다.
 * ───────────────────────────────────────────────────────────────────
 */

export interface SymbolPack {
  id: string;
  /** public 기준 에셋 디렉토리. */
  dir: string;
  ext: "png" | "svg";
  /** 상점에서 이 팩을 해금하는 데 드는 코인. 0이면 기본 보유(무료). */
  price: number;
}

// 표시 이름/설명은 i18n 사전(messages.ts)의 pack.<id>.label / pack.<id>.desc 키에 있다.
export const SYMBOL_PACKS: SymbolPack[] = [
  {
    id: "classic",
    dir: "symbols",
    ext: "png",
    price: 0,
  },
  {
    id: "pixel",
    dir: "symbols/pixel",
    ext: "svg",
    price: 300,
  },
  {
    id: "space",
    dir: "symbols/space",
    ext: "svg",
    price: 500,
  },
  {
    id: "instrument",
    dir: "symbols/instrument",
    ext: "svg",
    price: 500,
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

/**
 * Dobble 덱 심볼 총 개수(prime=7 → 7²+7+1 = 57). 모든 팩이 이 ID 집합을 공유한다.
 * game/preloadSymbols.ts의 계산과 일치해야 한다(packs.test.ts가 검증).
 */
export const SYMBOL_COUNT = 57;

/** 모든 팩이 공유하는 심볼 ID 목록: "001" ~ "057". */
export const SYMBOL_IDS: string[] = Array.from({ length: SYMBOL_COUNT }, (_, i) =>
  String(i + 1).padStart(3, "0"),
);

/** 상점 팩 카드에 보여줄 대표 미리보기 심볼(공유 ID라 팩 추가 시 추가 작업 없음). */
export const PREVIEW_SYMBOL_IDS: string[] = [
  "001",
  "010",
  "020",
  "030",
  "040",
  "050",
];

/**
 * 팩 매니페스트 무결성 검증: id 중복, 빈 필드, 음수 가격을 잡는다.
 * dev 빌드에서 모듈 로드 시 즉시 실행되어 잘못된 팩 추가를 바로 실패시킨다.
 */
export function validateSymbolPacks(packs: SymbolPack[] = SYMBOL_PACKS): void {
  const seen = new Set<string>();
  for (const pack of packs) {
    if (!pack.id) throw new Error("SymbolPack에 빈 id가 있습니다.");
    if (seen.has(pack.id)) {
      throw new Error(`SymbolPack id 중복: "${pack.id}"`);
    }
    seen.add(pack.id);
    if (!pack.dir) {
      throw new Error(`SymbolPack "${pack.id}"에 dir이 비었습니다.`);
    }
    if (!Number.isFinite(pack.price) || pack.price < 0) {
      throw new Error(`SymbolPack "${pack.id}"의 price가 올바르지 않습니다.`);
    }
  }
}

if (import.meta.env.DEV) {
  validateSymbolPacks();
}
