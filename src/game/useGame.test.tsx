// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useGame, type GameApi } from "./useGame";

let currentGame: GameApi;
let container: HTMLDivElement;
let root: Root;

function GameHarness() {
  currentGame = useGame({ totalCards: 4, seedFactory: () => 32 });
  return null;
}

function startAndReveal() {
  act(() => currentGame.start());
  act(() => currentGame.reveal());
  expect(currentGame.round).not.toBeNull();
}

function tapCorrect() {
  const hint = currentGame.round?.hint;
  if (hint == null) throw new Error("진행 중인 라운드가 필요합니다.");
  act(() => currentGame.tap(hint));
}

describe("useGame 최대 콤보", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    act(() => root.render(<GameHarness />));
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.useRealTimers();
    globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  });

  it("tap의 연속 정답마다 GameSnapshot.maxCombo를 갱신한다", async () => {
    startAndReveal();

    tapCorrect();
    expect(currentGame.maxCombo).toBe(1);
    await act(() => vi.advanceTimersByTimeAsync(450));

    tapCorrect();
    expect(currentGame.maxCombo).toBe(2);
    await act(() => vi.advanceTimersByTimeAsync(450));

    tapCorrect();
    expect(currentGame.maxCombo).toBe(3);
  });

  it("start와 retry가 최대 콤보를 각각 0으로 초기화한다", () => {
    startAndReveal();
    tapCorrect();
    expect(currentGame.maxCombo).toBe(1);

    act(() => currentGame.start());
    expect(currentGame.maxCombo).toBe(0);

    act(() => currentGame.reveal());
    tapCorrect();
    expect(currentGame.maxCombo).toBe(1);

    act(() => currentGame.retry());
    expect(currentGame.maxCombo).toBe(0);
  });
});
