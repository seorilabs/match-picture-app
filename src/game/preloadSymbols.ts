import { type SymbolPack, SYMBOL_IDS, symbolSrc } from "../symbols/packs";

/** 팩별 프리로드 진행 상태. 성공한 팩만 완료로 남겨 실패 시 재시도할 수 있게 합니다. */
const preloadPromises = new Map<string, Promise<boolean>>();
const preloadedPacks = new Set<string>();

/** 첫 라운드 대기의 상한(ms). 오프라인에서도 게임이 막히지 않게 합니다. */
export const PRELOAD_GATE_TIMEOUT_MS = 5000;

function decodeImage(src: string): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(true);
    image.onerror = () => resolve(false);
    image.src = src;
    if (typeof image.decode === "function") {
      void image
        .decode()
        .then(() => resolve(true))
        .catch(() => {
          // onload/onerror가 결과를 확정합니다.
        });
    }
  });
}

function schedule(run: () => void): void {
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(run, { timeout: 2000 });
  } else {
    window.setTimeout(run, 300);
  }
}

/**
 * 팩의 심볼 이미지 전체를 미리 디코딩합니다.
 *
 * 라운드 전환 때 처음 보는 심볼이 늦게 뜨는 현상을 막고, 첫 라운드 타이머를
 * 이미지 준비 뒤로 미룰 수 있도록 완료 시점을 Promise로 돌려줍니다.
 * 한 장이라도 실패하면 완료로 기록하지 않아 다음 호출에서 다시 시도합니다.
 */
export function preloadSymbolImages(pack: SymbolPack): Promise<boolean> {
  if (preloadedPacks.has(pack.id)) return Promise.resolve(true);
  const inflight = preloadPromises.get(pack.id);
  if (inflight) return inflight;

  if (typeof window === "undefined" || typeof Image === "undefined") {
    return Promise.resolve(true);
  }

  const promise = new Promise<boolean>((resolve) => {
    schedule(() => {
      void Promise.all(
        SYMBOL_IDS.map((symbol) => decodeImage(symbolSrc(pack, symbol))),
      ).then((results) => {
        const ok = results.every(Boolean);
        if (ok) preloadedPacks.add(pack.id);
        preloadPromises.delete(pack.id);
        resolve(ok);
      });
    });
  });

  preloadPromises.set(pack.id, promise);
  return promise;
}

/** 팩 프리로드가 이미 끝났는지. 게임 시작 게이트에서 즉시 판정할 때 씁니다. */
export function isPackPreloaded(pack: SymbolPack): boolean {
  return preloadedPacks.has(pack.id);
}

/**
 * 프리로드 완료를 기다리되 상한 시간을 넘기면 그냥 진행합니다.
 * 이미지 실패/오프라인에서도 게임이 영구히 막히지 않게 하기 위한 폴백입니다.
 */
export function waitForPackReady(
  pack: SymbolPack,
  timeoutMs = PRELOAD_GATE_TIMEOUT_MS,
): Promise<boolean> {
  const ready = preloadSymbolImages(pack);
  if (typeof window === "undefined") return ready;
  return Promise.race([
    ready,
    new Promise<boolean>((resolve) => {
      window.setTimeout(() => resolve(false), timeoutMs);
    }),
  ]);
}

/** 테스트 전용: 모듈 캐시를 비웁니다. */
export function resetPreloadStateForTest(): void {
  preloadPromises.clear();
  preloadedPacks.clear();
}
