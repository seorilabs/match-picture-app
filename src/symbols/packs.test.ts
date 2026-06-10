import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { symbolName } from "../game/deck";
import { PRIME } from "../game/rules";
import {
  DEFAULT_PACK_ID,
  SYMBOL_PACKS,
  getSymbolPack,
  symbolSrc,
} from "./packs";

const DECK_SYMBOL_COUNT = PRIME * PRIME + PRIME + 1;

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
          __dirname,
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
