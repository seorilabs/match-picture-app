// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const firebaseCustomToken = vi.fn(async () => ({
  firebaseCustomToken: "custom-token",
  appUserId: "user-1",
}));
const signIn = vi.fn(async () => undefined);
const signInWithCustomToken = vi.fn(async () => ({
  user: { getIdToken: async () => "id-token" },
}));

vi.mock("@seorilabs/platform-sdk", () => ({
  createPlatform: () => ({
    identity: { firebaseCustomToken },
    signIn,
  }),
}));

vi.mock("firebase/auth", () => ({
  getAuth: () => ({ currentUser: null }),
  signInWithCustomToken,
}));

vi.mock("./app", () => ({
  getFirebaseApp: () => ({ name: "test" }),
}));

const trackEvent = vi.fn(async () => undefined);
vi.mock("./analytics", () => ({
  trackEvent: (...args: unknown[]) => trackEvent(...(args as [])),
}));

const { ensurePlatformSession, resetPlatformSessionForTest } = await import(
  "./auth"
);

describe("ensurePlatformSession", () => {
  beforeEach(() => {
    resetPlatformSessionForTest();
    firebaseCustomToken.mockClear();
    signIn.mockClear();
    signInWithCustomToken.mockClear();
    trackEvent.mockClear();
    window.localStorage.clear();
  });

  afterEach(() => {
    resetPlatformSessionForTest();
  });

  it("세션 발급은 실행당 한 번만 일어나고 credential kind는 firebase-id-token이다", async () => {
    const first = await ensurePlatformSession();
    const second = await ensurePlatformSession();

    expect(first).toMatchObject({ ok: true, appUserId: "user-1" });
    expect(second).toBe(first);
    expect(firebaseCustomToken).toHaveBeenCalledTimes(1);
    expect(signIn).toHaveBeenCalledExactlyOnceWith({
      kind: "firebase-id-token",
      value: "id-token",
    });
  });

  it("custom token 값을 저장소에 남기지 않는다", async () => {
    await ensurePlatformSession();
    const dump = JSON.stringify({ ...window.localStorage });
    expect(dump).not.toContain("custom-token");
    expect(dump).not.toContain("id-token");
  });

  it("실패해도 예외를 던지지 않고 사유만 기록한다", async () => {
    firebaseCustomToken.mockRejectedValueOnce(new Error("bridge down"));
    const result = await ensurePlatformSession();
    expect(result).toEqual({ ok: false, reason: "custom-token-failed" });
    expect(trackEvent).toHaveBeenCalledWith("platform_session", {
      ok: false,
      reason: "custom-token-failed",
    });
  });
});
