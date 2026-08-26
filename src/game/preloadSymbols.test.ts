// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  isPackPreloaded,
  preloadSymbolImages,
  resetPreloadStateForTest,
  waitForPackReady,
} from "./preloadSymbols";
import { getSymbolPack } from "../symbols/packs";

const pack = getSymbolPack("classic");

/** 이미지 로드 결과를 제어하는 최소 스텁. */
function stubImage(outcome: "load" | "error" | "never"): void {
  class StubImage {
    decoding = "async";
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    #src = "";

    set src(value: string) {
      this.#src = value;
      if (outcome === "never") return;
      queueMicrotask(() => {
        if (outcome === "load") this.onload?.();
        else this.onerror?.();
      });
    }

    get src(): string {
      return this.#src;
    }
  }
  vi.stubGlobal("Image", StubImage);
}

describe("preloadSymbolImages", () => {
  beforeEach(() => {
    resetPreloadStateForTest();
    vi.stubGlobal("requestIdleCallback", undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    resetPreloadStateForTest();
  });

  it("모든 심볼이 디코딩되면 완료로 기록한다", async () => {
    stubImage("load");
    await expect(preloadSymbolImages(pack)).resolves.toBe(true);
    expect(isPackPreloaded(pack)).toBe(true);
    // 이미 끝난 팩은 즉시 완료를 돌려준다.
    await expect(preloadSymbolImages(pack)).resolves.toBe(true);
  });

  it("한 장이라도 실패하면 완료로 남기지 않아 재시도할 수 있다", async () => {
    stubImage("error");
    await expect(preloadSymbolImages(pack)).resolves.toBe(false);
    expect(isPackPreloaded(pack)).toBe(false);

    stubImage("load");
    await expect(preloadSymbolImages(pack)).resolves.toBe(true);
    expect(isPackPreloaded(pack)).toBe(true);
  });

  it("같은 팩을 동시에 요청하면 하나의 작업을 공유한다", async () => {
    stubImage("load");
    const first = preloadSymbolImages(pack);
    const second = preloadSymbolImages(pack);
    expect(second).toBe(first);
    await first;
  });

  it("응답이 오지 않아도 상한 시간이 지나면 게임 진행을 막지 않는다", async () => {
    vi.useFakeTimers();
    stubImage("never");
    const ready = waitForPackReady(pack, 5000);
    await vi.advanceTimersByTimeAsync(5000);
    await expect(ready).resolves.toBe(false);
    vi.useRealTimers();
  });
});
