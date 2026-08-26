import { describe, expect, it } from "vitest";

import {
  DROPLET_DAILY_CAP,
  STREAK_REWARDS,
  accuracy,
  applyClearStats,
  awardDroplets,
  computeAwardedComboBonus,
  computeCoinReward,
  computeComboBonus,
  createDefaultDroplets,
  createDefaultProfile,
  createDefaultStats,
  createDefaultStreak,
  equipPack,
  evaluateStreak,
  normalizeProfile,
  normalizeStats,
  ownsPack,
  parseProfile,
  purchasePack,
  serializeProfile,
  spendCoins,
  spendDroplet,
  streakReward,
  timeBucketId,
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
    const seconds = 20;
    const mode = "classic";
    const maxCombo = 2;
    const rewardedMaxCombo = 3;

    expect(computeCoinReward(seconds, mode, maxCombo)).toBe(10);
    expect(computeCoinReward(seconds, mode, rewardedMaxCombo)).toBe(13);
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

describe("spendCoins", () => {
  it("요청한 양만 정확히 차감한다", () => {
    const profile = { ...createDefaultProfile(), coins: 40 };
    const result = spendCoins(profile, 15);

    expect(result.ok).toBe(true);
    expect(result.profile.coins).toBe(25);
    expect(profile.coins).toBe(40);
  });

  it("코인이 부족하면 원래 프로필을 보존한다", () => {
    const profile = { ...createDefaultProfile(), coins: 14 };
    const result = spendCoins(profile, 15);

    expect(result).toEqual({
      ok: false,
      profile,
      reason: "not-enough-coins",
    });
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
    const p = normalizeProfile({
      coins: -5,
      ownedPackIds: ["nope"],
      equippedPackId: "nope",
    });
    expect(p.coins).toBe(0);
    expect(p.ownedPackIds).toEqual(["classic"]);
    expect(p.equippedPackId).toBe("classic");
  });

  it("round-trip 직렬화/파싱이 일치한다", () => {
    const p = {
      ...createDefaultProfile(),
      coins: 250,
      ownedPackIds: ["classic", "space"],
      equippedPackId: "space",
    };
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

describe("누적 통계", () => {
  it("클리어 결과를 모드/정확도/시간 버킷에 반영한다", () => {
    let stats = createDefaultStats();
    stats = applyClearStats(stats, {
      mode: "classic",
      seconds: 12,
      correctCount: 10,
      wrongCount: 0,
    });
    stats = applyClearStats(stats, {
      mode: "daily",
      seconds: 45,
      correctCount: 10,
      wrongCount: 3,
    });
    expect(stats.clears).toBe(2);
    expect(stats.clearsByMode.classic).toBe(1);
    expect(stats.clearsByMode.daily).toBe(1);
    expect(stats.correct).toBe(20);
    expect(stats.wrong).toBe(3);
    expect(stats.perfectClears).toBe(1);
    expect(stats.buckets.under15).toBe(1);
    expect(stats.buckets.over30).toBe(1);
  });

  it("시간 버킷 경계를 포함한다", () => {
    expect(timeBucketId(15)).toBe("under15");
    expect(timeBucketId(15.1)).toBe("under20");
    expect(timeBucketId(30)).toBe("under30");
    expect(timeBucketId(30.1)).toBe("over30");
  });

  it("정확도는 탭이 없으면 null이다", () => {
    expect(accuracy(0, 0)).toBeNull();
    expect(accuracy(9, 1)).toBeCloseTo(0.9);
  });

  it("손상된 통계를 안전 기본값으로 정규화한다", () => {
    const stats = normalizeStats({
      clears: -3,
      clearsByMode: { classic: "x", daily: 2 },
      buckets: { under15: 1.7, nope: 5 },
      correct: Number.NaN,
    });
    expect(stats.clears).toBe(0);
    expect(stats.clearsByMode.classic).toBe(0);
    expect(stats.clearsByMode.daily).toBe(2);
    expect(stats.buckets.under15).toBe(1);
    expect(stats.correct).toBe(0);
  });
});

describe("연속 출석", () => {
  it("어제 받았으면 연속일이 늘고 보상이 커진다", () => {
    const first = evaluateStreak(createDefaultStreak(), "2026-08-25");
    expect(first.claimed).toBe(true);
    expect(first.streak.count).toBe(1);
    expect(first.reward).toBe(STREAK_REWARDS[0]);

    const second = evaluateStreak(first.streak, "2026-08-26");
    expect(second.streak.count).toBe(2);
    expect(second.reward).toBe(STREAK_REWARDS[1]);
    expect(second.streak.best).toBe(2);
  });

  it("오늘 이미 받았으면 중복 지급하지 않는다", () => {
    const first = evaluateStreak(createDefaultStreak(), "2026-08-26");
    const again = evaluateStreak(first.streak, "2026-08-26");
    expect(again.claimed).toBe(false);
    expect(again.reward).toBe(0);
    expect(again.streak).toBe(first.streak);
  });

  it("하루 이상 비면 1일차로 리셋하되 최고 기록은 남긴다", () => {
    const streak = { count: 5, lastClaimedDate: "2026-08-20", best: 5 };
    const result = evaluateStreak(streak, "2026-08-26");
    expect(result.streak.count).toBe(1);
    expect(result.streak.best).toBe(5);
    expect(result.reward).toBe(STREAK_REWARDS[0]);
  });

  it("7일 이후 보상은 마지막 값을 유지한다", () => {
    expect(streakReward(7)).toBe(STREAK_REWARDS[6]);
    expect(streakReward(30)).toBe(STREAK_REWARDS[6]);
    expect(streakReward(0)).toBe(0);
  });
});

describe("물방울", () => {
  it("데일리는 2방울, 그 외는 1방울을 준다", () => {
    const base = createDefaultDroplets();
    expect(awardDroplets(base, "daily", "2026-08-26").gained).toBe(2);
    expect(awardDroplets(base, "classic", "2026-08-26").gained).toBe(1);
  });

  it("하루 상한을 넘기지 않는다", () => {
    let droplets = createDefaultDroplets();
    let total = 0;
    for (let i = 0; i < 5; i++) {
      const result = awardDroplets(droplets, "classic", "2026-08-26");
      droplets = result.droplets;
      total += result.gained;
    }
    expect(total).toBe(DROPLET_DAILY_CAP);
    expect(droplets.count).toBe(DROPLET_DAILY_CAP);
  });

  it("날짜가 바뀌면 일일 획득 카운트를 리셋한다", () => {
    const spent = { count: 3, date: "2026-08-25", earnedToday: DROPLET_DAILY_CAP };
    const result = awardDroplets(spent, "classic", "2026-08-26");
    expect(result.gained).toBe(1);
    expect(result.droplets.earnedToday).toBe(1);
    expect(result.droplets.count).toBe(4);
  });

  it("잔량이 없으면 사용에 실패한다", () => {
    expect(spendDroplet({ count: 0, date: "d", earnedToday: 0 }).ok).toBe(false);
    const used = spendDroplet({ count: 2, date: "d", earnedToday: 2 });
    expect(used.ok).toBe(true);
    expect(used.droplets.count).toBe(1);
  });
});

describe("난이도 가중 보상", () => {
  it("어려울수록 코인을 더 준다", () => {
    const easy = computeCoinReward(10, "classic", 0, "easy");
    const normal = computeCoinReward(10, "classic", 0, "normal");
    const hard = computeCoinReward(10, "classic", 0, "hard");
    expect(easy).toBeLessThan(normal);
    expect(hard).toBeGreaterThan(normal);
  });

  it("난이도 필드가 손상돼도 기본 난이도로 정규화한다", () => {
    expect(normalizeProfile({ difficulty: "insane" }).difficulty).toBe("normal");
    expect(normalizeProfile({ difficulty: "hard" }).difficulty).toBe("hard");
  });

  it("새 필드가 없는 구버전 프로필도 안전하게 읽는다", () => {
    const profile = normalizeProfile({ coins: 10 });
    expect(profile.stats.clears).toBe(0);
    expect(profile.streak.count).toBe(0);
    expect(profile.droplets.count).toBe(0);
    expect(profile.stages).toEqual({});
  });
});
