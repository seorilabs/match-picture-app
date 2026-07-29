import { describe, expect, it } from "vitest";

import { advanceComboProgress, createInitialComboProgress } from "./combo";

describe("콤보 진행", () => {
  it("연속 정답마다 현재/최대 콤보를 함께 올린다", () => {
    let progress = createInitialComboProgress();
    progress = advanceComboProgress(progress, true);
    progress = advanceComboProgress(progress, true);
    progress = advanceComboProgress(progress, true);

    expect(progress).toEqual({ combo: 3, maxCombo: 3 });
  });

  it("오답은 현재 콤보만 초기화하고 최대 콤보는 유지한다", () => {
    const progress = advanceComboProgress({ combo: 4, maxCombo: 4 }, false);

    expect(progress).toEqual({ combo: 0, maxCombo: 4 });
  });

  it("새 게임 진행값은 현재/최대 콤보를 모두 0으로 초기화한다", () => {
    expect(createInitialComboProgress()).toEqual({ combo: 0, maxCombo: 0 });
  });
});
