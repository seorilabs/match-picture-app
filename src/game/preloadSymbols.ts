import { symbolName } from "./deck";
import { PRIME } from "./rules";

/** Dobble 덱이 사용하는 전체 심볼 수: prime^2 + prime + 1 (7 기준 57). */
const SYMBOL_COUNT = PRIME * PRIME + PRIME + 1;

let started = false;

/**
 * 덱에서 쓰일 수 있는 심볼 PNG 전체를 미리 디코딩해 둡니다.
 * 라운드 전환 때 처음 보는 심볼이 늦게 뜨는 현상을 막기 위한 것으로,
 * 메인 스레드를 막지 않도록 idle 타이밍에 한 번만 실행합니다.
 */
export function preloadSymbolImages(): void {
  if (started || typeof window === "undefined" || typeof Image === "undefined") {
    return;
  }
  started = true;

  const run = () => {
    for (let i = 1; i <= SYMBOL_COUNT; i++) {
      const image = new Image();
      image.decoding = "async";
      image.src = `${import.meta.env.BASE_URL}symbols/${symbolName(i)}.png`;
      if (typeof image.decode === "function") {
        // src 할당만으로는 fetch까지만 보장되므로 decode()로 디코딩까지 끝냅니다.
        void image.decode().catch(() => {
          // 디코딩 실패(404 등)는 게임 흐름에 영향 없으므로 무시합니다.
        });
      }
    }
  };

  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(run, { timeout: 2000 });
  } else {
    window.setTimeout(run, 300);
  }
}
