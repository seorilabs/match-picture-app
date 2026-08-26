import { describe, expect, it } from "vitest";

import {
  HAPTICS_STORAGE_KEY,
  SOUND_STORAGE_KEY,
  parseToggle,
  serializeToggle,
} from "./settings";

describe("설정 직렬화", () => {
  it("저장값이 없으면 기본값(켜짐)을 쓴다", () => {
    expect(parseToggle(null)).toBe(true);
    expect(parseToggle("nope")).toBe(true);
    expect(parseToggle(null, false)).toBe(false);
  });

  it('기존 사용자의 "1"/"0" 저장값을 그대로 승계한다', () => {
    expect(parseToggle("1")).toBe(true);
    expect(parseToggle("0")).toBe(false);
    expect(serializeToggle(true)).toBe("1");
    expect(serializeToggle(false)).toBe("0");
  });

  it("사운드 키는 게임 화면이 쓰던 키를 유지한다", () => {
    expect(SOUND_STORAGE_KEY).toBe("match-picture/sound-enabled");
    expect(HAPTICS_STORAGE_KEY).toBe("match-picture/haptics-enabled");
  });

  it("직렬화와 파싱이 왕복한다", () => {
    for (const value of [true, false]) {
      expect(parseToggle(serializeToggle(value))).toBe(value);
    }
  });
});
