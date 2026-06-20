import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { symbolName } from "../game/deck";
import { PRIME } from "../game/rules";
import {
  DEFAULT_PACK_ID,
  PREVIEW_SYMBOL_IDS,
  SYMBOL_COUNT,
  SYMBOL_IDS,
  SYMBOL_PACKS,
  getSymbolPack,
  symbolSrc,
  validateSymbolPacks,
} from "./packs";

const DECK_SYMBOL_COUNT = PRIME * PRIME + PRIME + 1;

// ESM 환경에서도 안전하도록 __dirname 대신 import.meta.url로 계산합니다.
const testDir = dirname(fileURLToPath(import.meta.url));

describe("SYMBOL_PACKS", () => {
  it("팩 ID는 중복되지 않는다", () => {
    const ids = SYMBOL_PACKS.map((pack) => pack.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("기본 팩이 목록에 존재한다", () => {
    expect(SYMBOL_PACKS.some((pack) => pack.id === DEFAULT_PACK_ID)).toBe(true);
  });

  it("모든 팩이 덱에 필요한 57개 에셋을 실제로 갖고 있다", () => {
    for (const pack of SYMBOL_PACKS) {
      for (let i = 1; i <= DECK_SYMBOL_COUNT; i++) {
        const assetPath = resolve(
          testDir,
          "../../public",
          pack.dir,
          `${symbolName(i)}.${pack.ext}`,
        );
        expect(existsSync(assetPath), `${pack.id}: ${assetPath} 없음`).toBe(
          true,
        );
      }
    }
  });
});

describe("심볼 ID 공간 / 검증", () => {
  it("SYMBOL_COUNT가 덱 계산(prime²+prime+1)과 일치한다", () => {
    expect(SYMBOL_COUNT).toBe(DECK_SYMBOL_COUNT);
    expect(SYMBOL_IDS).toHaveLength(SYMBOL_COUNT);
    expect(SYMBOL_IDS[0]).toBe("001");
    expect(SYMBOL_IDS[SYMBOL_IDS.length - 1]).toBe("057");
  });

  it("미리보기 ID는 모두 유효한 공유 심볼 ID다", () => {
    for (const id of PREVIEW_SYMBOL_IDS) {
      expect(SYMBOL_IDS).toContain(id);
    }
  });

  it("validateSymbolPacks는 정상 매니페스트를 통과시킨다", () => {
    expect(() => validateSymbolPacks()).not.toThrow();
  });

  it("validateSymbolPacks는 id 중복/음수 가격을 잡는다", () => {
    expect(() =>
      validateSymbolPacks([
        { id: "a", dir: "d", ext: "png", price: 0 },
        { id: "a", dir: "d", ext: "png", price: 0 },
      ]),
    ).toThrow(/중복/);
    expect(() =>
      validateSymbolPacks([{ id: "a", dir: "d", ext: "png", price: -1 }]),
    ).toThrow(/price/);
  });
});

describe("getSymbolPack", () => {
  it("등록된 팩을 ID로 찾는다", () => {
    expect(getSymbolPack("pixel").id).toBe("pixel");
  });

  it("모르는 ID나 빈 값은 클래식으로 fallback한다", () => {
    expect(getSymbolPack("removed-pack").id).toBe(DEFAULT_PACK_ID);
    expect(getSymbolPack(null).id).toBe(DEFAULT_PACK_ID);
    expect(getSymbolPack(undefined).id).toBe(DEFAULT_PACK_ID);
  });
});

describe("symbolSrc", () => {
  it("팩 디렉토리와 확장자를 반영한 경로를 만든다", () => {
    expect(symbolSrc(getSymbolPack("classic"), "001")).toMatch(
      /symbols\/001\.png$/,
    );
    expect(symbolSrc(getSymbolPack("pixel"), "042")).toMatch(
      /symbols\/pixel\/042\.svg$/,
    );
  });
});
