import { describe, expect, it } from "vitest";

import {
  computeCoinReward,
  createDefaultProfile,
  equipPack,
  normalizeProfile,
  ownsPack,
  parseProfile,
  purchasePack,
  serializeProfile,
} from "./profile";

describe("createDefaultProfile", () => {
  it("코인 0, 무료 팩(classic) 보유, classic 장착으로 시작한다", () => {
    const p = createDefaultProfile();
    expect(p.coins).toBe(0);
    expect(p.ownedPackIds).toContain("classic");
    expect(p.equippedPackId).toBe("classic");
  });
});

describe("computeCoinReward", () => {
  it("빠를수록 보상이 크고, 느려도 기본 보상은 받는다", () => {
    expect(computeCoinReward(0, "classic")).toBe(30); // 10 + 20 보너스
    expect(computeCoinReward(20, "classic")).toBe(10); // 보너스 0
    expect(computeCoinReward(60, "classic")).toBe(10); // 음수 보너스는 0으로
  });

  it("도전장 모드는 절반만 지급한다", () => {
    expect(computeCoinReward(0, "challenge")).toBe(15);
  });
});

describe("purchasePack", () => {
  it("코인이 충분하면 차감하고 보유에 추가한다", () => {
    const p = { ...createDefaultProfile(), coins: 500 };
    const result = purchasePack(p, "pixel"); // price 300
    expect(result.ok).toBe(true);
    expect(result.profile.coins).toBe(200);
    expect(ownsPack(result.profile, "pixel")).toBe(true);
  });

  it("코인이 부족하면 실패하고 상태를 바꾸지 않는다", () => {
    const p = { ...createDefaultProfile(), coins: 100 };
    const result = purchasePack(p, "pixel");
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("not-enough-coins");
    expect(result.profile.coins).toBe(100);
    expect(ownsPack(result.profile, "pixel")).toBe(false);
  });

  it("이미 보유한 팩은 다시 살 수 없다", () => {
    const p = { ...createDefaultProfile(), coins: 999 };
    expect(purchasePack(p, "classic").reason).toBe("already-owned");
  });
});

describe("equipPack", () => {
  it("보유한 팩만 장착할 수 있다", () => {
    const p = { ...createDefaultProfile(), coins: 999 };
    expect(equipPack(p, "pixel").equippedPackId).toBe("classic"); // 미보유 → 변화 없음
    const bought = purchasePack(p, "pixel").profile;
    expect(equipPack(bought, "pixel").equippedPackId).toBe("pixel");
  });
});

describe("normalizeProfile / 직렬화", () => {
  it("손상된 입력도 안전한 기본값으로 정규화한다", () => {
    const p = normalizeProfile({ coins: -5, ownedPackIds: ["nope"], equippedPackId: "nope" });
    expect(p.coins).toBe(0);
    expect(p.ownedPackIds).toEqual(["classic"]);
    expect(p.equippedPackId).toBe("classic");
  });

  it("round-trip 직렬화/파싱이 일치한다", () => {
    const p = { ...createDefaultProfile(), coins: 250, ownedPackIds: ["classic", "space"], equippedPackId: "space" };
    expect(parseProfile(serializeProfile(p))).toEqual(p);
  });

  it("null 직렬화 입력은 기본 프로필을 돌려준다", () => {
    expect(parseProfile(null)).toEqual(createDefaultProfile());
  });
});
