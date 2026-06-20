import { describe, expect, it } from "vitest";

import {
  applyClear,
  canClaim,
  claim,
  createDailyMissions,
  ensureToday,
  isComplete,
  normalizeDailyMissions,
} from "./missions";

describe("createDailyMissions", () => {
  it("모든 미션이 진행 0, 미수령으로 시작한다", () => {
    const dm = createDailyMissions("2026-06-20");
    expect(dm.date).toBe("2026-06-20");
    expect(dm.states.play3).toEqual({ progress: 0, claimed: false });
    expect(dm.states.fastClear.progress).toBe(0);
    expect(dm.states.daily.claimed).toBe(false);
  });
});

describe("ensureToday", () => {
  it("날짜가 같으면 그대로, 다르면 새 미션으로 리셋한다", () => {
    const dm = applyClear(createDailyMissions("2026-06-20"), {
      seconds: 5,
      mode: "classic",
    });
    expect(ensureToday(dm, "2026-06-20")).toBe(dm);
    const reset = ensureToday(dm, "2026-06-21");
    expect(reset.date).toBe("2026-06-21");
    expect(reset.states.play3.progress).toBe(0);
  });
});

describe("applyClear", () => {
  it("플레이 카운트를 올리고 target을 넘지 않는다", () => {
    let dm = createDailyMissions("d");
    for (let i = 0; i < 5; i++) dm = applyClear(dm, { seconds: 30, mode: "classic" });
    expect(dm.states.play3.progress).toBe(3); // target 3 cap
  });

  it("15초 이내면 fastClear, 데일리 모드면 daily가 완료된다", () => {
    const fast = applyClear(createDailyMissions("d"), {
      seconds: 12,
      mode: "daily",
    });
    expect(isComplete(fast, "fastClear")).toBe(true);
    expect(isComplete(fast, "daily")).toBe(true);
  });

  it("느린 클래식 클리어는 fastClear/daily를 올리지 않는다", () => {
    const slow = applyClear(createDailyMissions("d"), {
      seconds: 40,
      mode: "classic",
    });
    expect(isComplete(slow, "fastClear")).toBe(false);
    expect(isComplete(slow, "daily")).toBe(false);
  });
});

describe("claim", () => {
  it("완료한 미션만 보상을 주고, 한 번만 받을 수 있다", () => {
    let dm = applyClear(createDailyMissions("d"), { seconds: 10, mode: "classic" });
    expect(canClaim(dm, "fastClear")).toBe(true);
    const first = claim(dm, "fastClear");
    expect(first.reward).toBe(50);
    dm = first.missions;
    expect(canClaim(dm, "fastClear")).toBe(false);
    expect(claim(dm, "fastClear").reward).toBe(0); // 재수령 불가
  });

  it("미완료 미션은 수령 불가", () => {
    const dm = createDailyMissions("d");
    expect(claim(dm, "play3").reward).toBe(0);
  });

  it("수령 후 진행도는 더 오르지 않는다", () => {
    let dm = applyClear(createDailyMissions("d"), { seconds: 10, mode: "classic" });
    dm = claim(dm, "fastClear").missions;
    dm = applyClear(dm, { seconds: 8, mode: "classic" });
    expect(dm.states.fastClear.claimed).toBe(true);
  });
});

describe("normalizeDailyMissions", () => {
  it("손상 입력은 빈 날짜의 기본 미션으로 정규화된다", () => {
    const dm = normalizeDailyMissions({ date: 5, states: "x" });
    expect(dm.date).toBe("");
    expect(dm.states.play3).toEqual({ progress: 0, claimed: false });
  });
});
