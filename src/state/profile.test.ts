import { describe, expect, it } from "vitest";

import {
  computeAwardedComboBonus,
  computeComboBonus,
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
    expect(computeCoinReward(0, "classic", 0)).toBe(30); // 10 + 20 보너스
    expect(computeCoinReward(20, "classic", 0)).toBe(10); // 보너스 0
    expect(computeCoinReward(60, "classic", 0)).toBe(10); // 음수 보너스는 0으로
  });

  it("최대 콤보 2 이하는 보너스가 없고 3부터 3코인씩 최대 20코인을 더한다", () => {
    expect(computeComboBonus(0)).toBe(0);
    expect(computeComboBonus(2)).toBe(0);
    expect(computeComboBonus(3)).toBe(3);
    expect(computeComboBonus(8)).toBe(18);
    expect(computeComboBonus(20)).toBe(20);
    expect(computeCoinReward(20, "classic", 8)).toBe(28);
  });

  it("computeCoinReward는 최대 콤보 2 이하에는 보너스 0, 3부터 보너스를 더한다", () => {
    expect([
      computeCoinReward(20, "classic", 0),
      computeCoinReward(20, "classic", 2),
      computeCoinReward(20, "classic", 3),
    ]).toEqual([10, 10, 13]);
  });

  it("도전장 모드는 속도와 콤보를 합산한 전체 보상을 절반으로 지급한다", () => {
    // 기본 10 + 속도 20 + 콤보 18 = 48, 도전장은 절반인 24.
    expect(computeCoinReward(0, "challenge", 8)).toBe(24);
    expect(computeAwardedComboBonus(0, "challenge", 8)).toBe(9);
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

  it("정원/미션 필드가 없던 구 버전 프로필도 안전하게 마이그레이션된다", () => {
    // garden·missions가 추가되기 전 형태(coins/ownedPackIds/equippedPackId만 존재).
    const legacy = JSON.stringify({
      coins: 320,
      ownedPackIds: ["classic", "pixel"],
      equippedPackId: "pixel",
    });
    const p = parseProfile(legacy);
    expect(p.coins).toBe(320);
    expect(p.equippedPackId).toBe("pixel");
    // 누락 필드는 기본값으로 채워진다(빈 날짜 → Provider가 오늘로 리셋).
    expect(p.missions.date).toBe("");
    expect(p.garden.plots[0]?.speciesId).toBe("sprout");
  });
});
