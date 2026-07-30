// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useGame, type GameApi, type GameSnapshot } from "./useGame";

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

  it("useGame tap은 GameSnapshot.maxCombo를 Math.max로 갱신한다", async () => {
    startAndReveal();
    let maxCombo: number = 0;

    let nextCombo = 1;
    tapCorrect();
    maxCombo = Math.max(maxCombo, nextCombo);
    let snapshot: GameSnapshot = currentGame;
    expect(snapshot.maxCombo).toBe(maxCombo);
    await act(() => vi.advanceTimersByTimeAsync(450));

    nextCombo = 2;
    tapCorrect();
    maxCombo = Math.max(maxCombo, nextCombo);
    snapshot = currentGame;
    expect(snapshot.maxCombo).toBe(maxCombo);
    await act(() => vi.advanceTimersByTimeAsync(450));

    nextCombo = 3;
    tapCorrect();
    maxCombo = Math.max(maxCombo, nextCombo);
    snapshot = currentGame;
    expect(snapshot.maxCombo).toBe(maxCombo);
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

  it("힌트와 소거 효과를 현재 라운드에 즉시 반영하고 중복 사용을 막는다", () => {
    startAndReveal();
    const wrongSymbols =
      currentGame.round?.mine.filter(
        (symbol) => symbol !== currentGame.round?.hint,
      ) ?? [];

    let hintApplied = false;
    act(() => {
      hintApplied = currentGame.applyPowerUpEffect({ id: "hint" });
    });
    expect(hintApplied).toBe(true);
    expect(currentGame.powerUpHintActive).toBe(true);

    let duplicateApplied = true;
    act(() => {
      duplicateApplied = currentGame.applyPowerUpEffect({ id: "hint" });
    });
    expect(duplicateApplied).toBe(false);

    let eliminateApplied = false;
    act(() => {
      eliminateApplied = currentGame.applyPowerUpEffect({
        id: "eliminate",
        eliminatedSymbols: wrongSymbols.slice(0, 2),
      });
    });
    expect(eliminateApplied).toBe(true);
    expect(currentGame.eliminatedSymbols).toEqual(wrongSymbols.slice(0, 2));
    expect(currentGame.usedPowerUps).toEqual(["hint", "eliminate"]);
  });

  it("정답 뒤 다음 라운드에서는 파워업 사용 상태를 초기화한다", async () => {
    startAndReveal();
    act(() => {
      currentGame.applyPowerUpEffect({ id: "hint" });
    });
    expect(currentGame.powerUpHintActive).toBe(true);

    tapCorrect();
    await act(() => vi.advanceTimersByTimeAsync(450));

    expect(currentGame.roundIndex).toBe(1);
    expect(currentGame.powerUpHintActive).toBe(false);
    expect(currentGame.usedPowerUps).toEqual([]);
    expect(currentGame.eliminatedSymbols).toEqual([]);
  });
});
