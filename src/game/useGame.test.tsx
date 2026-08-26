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

function tapWrong() {
  const round = currentGame.round;
  if (round == null) throw new Error("진행 중인 라운드가 필요합니다.");
  const wrong = round.mine.find((symbol) => symbol !== round.hint);
  if (wrong == null) throw new Error("오답 심볼이 필요합니다.");
  act(() => currentGame.tap(wrong));
}

describe("useGame 잠금/일시정지/기록", () => {
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

  it("정답 대기와 오답 패널티의 잠금 이유를 구분한다", async () => {
    startAndReveal();
    expect(currentGame.lockKind).toBeNull();

    tapCorrect();
    expect(currentGame.locked).toBe(true);
    expect(currentGame.lockKind).toBe("correct");
    await act(() => vi.advanceTimersByTimeAsync(450));
    expect(currentGame.lockKind).toBeNull();

    tapWrong();
    expect(currentGame.lockKind).toBe("penalty");
    await act(() => vi.advanceTimersByTimeAsync(currentGame.penaltyDurationMs));
    expect(currentGame.lockKind).toBeNull();
    expect(currentGame.locked).toBe(false);
  });

  it("일시정지 동안에는 경과 시간이 늘지 않고, 재개하면 이어진다", async () => {
    startAndReveal();
    await act(() => vi.advanceTimersByTimeAsync(2000));
    const beforePause = currentGame.elapsedSeconds;
    expect(beforePause).toBeGreaterThan(1.5);

    act(() => currentGame.pause());
    expect(currentGame.paused).toBe(true);
    await act(() => vi.advanceTimersByTimeAsync(10000));
    expect(currentGame.elapsedSeconds).toBeCloseTo(beforePause, 5);

    act(() => currentGame.resume());
    expect(currentGame.paused).toBe(false);
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(currentGame.elapsedSeconds).toBeGreaterThan(beforePause);
    expect(currentGame.elapsedSeconds).toBeLessThan(beforePause + 2);
  });

  it("오답 패널티 중 일시정지해도 남은 잠금 시간이 보존된다", async () => {
    startAndReveal();
    tapWrong();
    await act(() => vi.advanceTimersByTimeAsync(500));

    act(() => currentGame.pause());
    await act(() => vi.advanceTimersByTimeAsync(5000));
    expect(currentGame.locked).toBe(true);
    expect(currentGame.lockKind).toBe("penalty");

    act(() => currentGame.resume());
    await act(() => vi.advanceTimersByTimeAsync(999));
    expect(currentGame.locked).toBe(true);
    await act(() => vi.advanceTimersByTimeAsync(10));
    expect(currentGame.locked).toBe(false);

    // 재개 후 정상 입력이 가능해야 한다.
    tapCorrect();
    expect(currentGame.correctCount).toBe(1);
  });

  it("일시정지 중에는 탭과 파워업이 무시된다", () => {
    startAndReveal();
    act(() => currentGame.pause());
    tapCorrect();
    expect(currentGame.correctCount).toBe(0);
    let applied = true;
    act(() => {
      applied = currentGame.applyPowerUpEffect({ id: "hint" });
    });
    expect(applied).toBe(false);
  });

  it("라운드별 정오답 로그를 남긴다", async () => {
    startAndReveal();
    tapCorrect();
    await act(() => vi.advanceTimersByTimeAsync(450));
    expect(currentGame.roundResults).toEqual([true]);

    tapWrong();
    await act(() => vi.advanceTimersByTimeAsync(currentGame.penaltyDurationMs));
    tapCorrect();
    await act(() => vi.advanceTimersByTimeAsync(450));
    expect(currentGame.roundResults).toEqual([true, false]);
  });

  it("파워업 사용 수는 라운드가 바뀌어도 유지되고 start/retry에서만 초기화된다", async () => {
    startAndReveal();
    act(() => {
      currentGame.applyPowerUpEffect({ id: "hint" });
    });
    expect(currentGame.powerUpUseCount).toBe(1);

    tapCorrect();
    await act(() => vi.advanceTimersByTimeAsync(450));
    expect(currentGame.usedPowerUps).toEqual([]);
    expect(currentGame.powerUpUseCount).toBe(1);

    act(() => {
      currentGame.applyPowerUpEffect({ id: "hint" });
    });
    expect(currentGame.powerUpUseCount).toBe(2);

    act(() => currentGame.retry());
    expect(currentGame.powerUpUseCount).toBe(0);
  });
});
