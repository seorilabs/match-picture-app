export interface ComboProgress {
  combo: number;
  maxCombo: number;
}

/** 새 게임에서 사용하는 콤보 초기값입니다. */
export function createInitialComboProgress(): ComboProgress {
  return { combo: 0, maxCombo: 0 };
}

/** 한 번의 탭 판정을 현재/최대 콤보에 반영합니다. */
export function advanceComboProgress(
  current: ComboProgress,
  isCorrect: boolean,
): ComboProgress {
  const nextCombo = isCorrect ? current.combo + 1 : 0;
  return {
    combo: nextCombo,
    maxCombo: Math.max(current.maxCombo, nextCombo),
  };
}
