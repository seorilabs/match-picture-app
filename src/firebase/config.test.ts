import { describe, expect, it } from "vitest";

import { envOverride, firebaseConfig } from "./config";

/**
 * org 재사용 배포 워크플로우는 저장소에 Firebase Variable이 없으면
 * `VITE_FIREBASE_*`를 빈 문자열로 넘긴다. 빈 문자열이 기본값을 덮으면 배포 빌드에서
 * Analytics, Remote Config(전면 광고 kill-switch 포함), 인증이 한꺼번에 죽는다.
 */
describe("envOverride", () => {
  it("keeps the fallback when the build passes no value", () => {
    expect(envOverride(undefined, "fallback")).toBe("fallback");
  });

  it("keeps the fallback when the build passes a blank value", () => {
    expect(envOverride("", "fallback")).toBe("fallback");
    expect(envOverride("   ", "fallback")).toBe("fallback");
  });

  it("takes the override when the build passes a real value", () => {
    expect(envOverride("G-OVERRIDE", "fallback")).toBe("G-OVERRIDE");
    expect(envOverride("  G-OVERRIDE  ", "fallback")).toBe("G-OVERRIDE");
  });
});

describe("firebaseConfig", () => {
  it("keeps every field non-empty so Firebase can initialize", () => {
    for (const [key, value] of Object.entries(firebaseConfig)) {
      expect(
        value,
        `${key}가 비어 있으면 Firebase 초기화가 실패한다`,
      ).toBeTruthy();
    }
  });

  it("keeps the GA4 measurement id so analytics is not silently disabled", () => {
    expect(firebaseConfig.measurementId).toBe("G-L5GMV0NX7C");
    expect(firebaseConfig.projectId).toBe("match-picture-app");
  });
});
