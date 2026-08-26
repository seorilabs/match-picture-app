import { describe, expect, it } from "vitest";

import {
  COMBO_MASTER_THRESHOLD,
  DAILY_MISSION_COUNT,
  MISSION_POOL,
  applyClear,
  canClaim,
  claim,
  createDailyMissions,
  ensureToday,
  isComplete,
  missionState,
  normalizeDailyMissions,
  selectMissionIds,
  type ClearInfo,
} from "./missions";

function clear(overrides: Partial<ClearInfo> = {}): ClearInfo {
  return { seconds: 30, mode: "classic", maxCombo: 1, wrongCount: 2, ...overrides };
}

describe("selectMissionIds", () => {
  it("같은 날짜는 항상 같은 조합을 고른다", () => {
    expect(selectMissionIds("2026-08-26")).toEqual(selectMissionIds("2026-08-26"));
  });

  it("정해진 개수만큼 중복 없이 고른다", () => {
    const ids = selectMissionIds("2026-08-26");
    expect(ids).toHaveLength(DAILY_MISSION_COUNT);
    expect(new Set(ids).size).toBe(DAILY_MISSION_COUNT);
    for (const id of ids) {
      expect(MISSION_POOL.some((def) => def.id === id)).toBe(true);
    }
  });

  it("날짜가 다르면 대부분 다른 조합이 된다", () => {
    const dates = [
      "2026-08-20",
      "2026-08-21",
      "2026-08-22",
      "2026-08-23",
      "2026-08-24",
      "2026-08-25",
      "2026-08-26",
    ];
    const combos = new Set(dates.map((date) => selectMissionIds(date).join(",")));
    expect(combos.size).toBeGreaterThan(1);
  });
});

describe("normalizeDailyMissions", () => {
  it("손상된 입력을 안전한 기본값으로 되돌린다", () => {
    const dm = normalizeDailyMissions({ date: 3, states: "nope" });
    expect(dm.date).toBe("");
    expect(dm.ids).toHaveLength(DAILY_MISSION_COUNT);
    for (const id of dm.ids) {
      expect(missionState(dm, id)).toEqual({ progress: 0, claimed: false });
    }
  });

  it("ids가 없는 구버전 저장본은 날짜에서 조합을 복원한다", () => {
    const dm = normalizeDailyMissions({
      date: "2026-08-26",
      states: { play3: { progress: 2, claimed: false } },
    });
    expect(dm.ids).toEqual(selectMissionIds("2026-08-26"));
  });
});

describe("ensureToday", () => {
  it("날짜가 바뀌면 새 조합으로 리셋한다", () => {
    const before = applyClear(createDailyMissions("2026-08-25"), clear());
    const after = ensureToday(before, "2026-08-26");
    expect(after.date).toBe("2026-08-26");
    expect(after.ids).toEqual(selectMissionIds("2026-08-26"));
    for (const id of after.ids) {
      expect(missionState(after, id).progress).toBe(0);
    }
  });

  it("같은 날짜면 그대로 둔다", () => {
    const dm = createDailyMissions("2026-08-26");
    expect(ensureToday(dm, "2026-08-26")).toBe(dm);
  });
});

describe("applyClear", () => {
  it("조건을 만족하는 선택된 미션만 진행한다", () => {
    const dm = {
      date: "d",
      ids: ["play3", "fastClear", "noMistake"] as const,
      states: {
        play3: { progress: 0, claimed: false },
        fastClear: { progress: 0, claimed: false },
        noMistake: { progress: 0, claimed: false },
      },
    };
    const next = applyClear(
      { ...dm, ids: [...dm.ids] },
      clear({ seconds: 10, wrongCount: 0 }),
    );
    expect(missionState(next, "play3").progress).toBe(1);
    expect(missionState(next, "fastClear").progress).toBe(1);
    expect(missionState(next, "noMistake").progress).toBe(1);
  });

  it("조건을 만족하지 않으면 올리지 않는다", () => {
    const dm = {
      date: "d",
      ids: ["fastClear", "comboMaster", "noMistake"] as const,
      states: {},
    };
    const next = applyClear(
      { ...dm, ids: [...dm.ids] },
      clear({ seconds: 40, maxCombo: 1, wrongCount: 3 }),
    );
    expect(missionState(next, "fastClear").progress).toBe(0);
    expect(missionState(next, "comboMaster").progress).toBe(0);
    expect(missionState(next, "noMistake").progress).toBe(0);
  });

  it("콤보 미션은 임계값 이상에서만 완료된다", () => {
    const dm = { date: "d", ids: ["comboMaster"] as const, states: {} };
    const next = applyClear(
      { ...dm, ids: [...dm.ids] },
      clear({ maxCombo: COMBO_MASTER_THRESHOLD }),
    );
    expect(isComplete(next, "comboMaster")).toBe(true);
  });

  it("선택되지 않은 미션은 진행하지 않는다", () => {
    const dm = { date: "d", ids: ["play3"] as const, states: {} };
    const next = applyClear({ ...dm, ids: [...dm.ids] }, clear());
    expect(next.states.fastClear).toBeUndefined();
  });
});

describe("claim", () => {
  it("완료한 미션만 보상을 주고, 한 번만 받을 수 있다", () => {
    let dm = applyClear(
      { date: "d", ids: ["fastClear"], states: {} },
      clear({ seconds: 10 }),
    );
    expect(canClaim(dm, "fastClear")).toBe(true);
    const first = claim(dm, "fastClear");
    expect(first.reward).toBe(50);
    dm = first.missions;
    expect(canClaim(dm, "fastClear")).toBe(false);
    expect(claim(dm, "fastClear").reward).toBe(0);
  });

  it("수령 후 진행도는 더 오르지 않는다", () => {
    let dm = applyClear(
      { date: "d", ids: ["fastClear"], states: {} },
      clear({ seconds: 10 }),
    );
    dm = claim(dm, "fastClear").missions;
    dm = applyClear(dm, clear({ seconds: 8 }));
    expect(missionState(dm, "fastClear").claimed).toBe(true);
  });
});
