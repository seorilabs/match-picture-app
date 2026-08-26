import { describe, expect, it } from "vitest";

import { createGameClearEventPayload } from "./clearEvent";

describe("game_clear 이벤트", () => {
  it("모드와 반올림한 기록에 최대 콤보를 포함한다", () => {
    expect(createGameClearEventPayload("daily", 12.6, 7)).toEqual({
      mode: "daily",
      seconds: 13,
      maxCombo: 7,
      powerUpUseCount: 0,
    });
  });

  it("파워업 사용 횟수를 payload에 담는다", () => {
    expect(createGameClearEventPayload("classic", 20, 3, 2).powerUpUseCount).toBe(2);
  });
});
