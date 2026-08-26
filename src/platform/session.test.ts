import { describe, expect, it, vi } from "vitest";

import {
  openPlatformSession,
  type PlatformSessionDeps,
} from "./session";

function deps(overrides: Partial<PlatformSessionDeps> = {}): PlatformSessionDeps {
  return {
    getExistingIdToken: async () => null,
    requestCustomToken: async () => ({
      firebaseCustomToken: "custom-token",
      appUserId: "user-1",
    }),
    signInWithCustomToken: async () => "id-token",
    openSession: async () => undefined,
    ...overrides,
  };
}

describe("openPlatformSession", () => {
  it("bootstrap → Firebase 로그인 → 세션 순으로 한 번씩만 호출한다", async () => {
    const requestCustomToken = vi.fn(async () => ({
      firebaseCustomToken: "custom-token",
      appUserId: "user-1",
    }));
    const signInWithCustomToken = vi.fn(async () => "id-token");
    const openSession = vi.fn(async () => undefined);

    const result = await openPlatformSession(
      deps({ requestCustomToken, signInWithCustomToken, openSession }),
    );

    expect(result).toEqual({
      ok: true,
      appUserId: "user-1",
      reusedExistingUser: false,
    });
    expect(requestCustomToken).toHaveBeenCalledTimes(1);
    expect(signInWithCustomToken).toHaveBeenCalledExactlyOnceWith("custom-token");
    expect(openSession).toHaveBeenCalledExactlyOnceWith("id-token");
  });

  it("이미 로그인된 사용자가 있으면 기존 ID token으로 같은 신원을 잇는다", async () => {
    const requestCustomToken = vi.fn(async () => ({
      firebaseCustomToken: "custom-token",
      appUserId: "user-1",
    }));

    const result = await openPlatformSession(
      deps({
        getExistingIdToken: async () => "existing-id-token",
        requestCustomToken,
      }),
    );

    expect(requestCustomToken).toHaveBeenCalledWith("existing-id-token");
    expect(result).toMatchObject({ ok: true, reusedExistingUser: true });
  });

  it("기존 사용자 조회가 실패해도 새 신원으로 계속 진행한다", async () => {
    const requestCustomToken = vi.fn(async () => ({
      firebaseCustomToken: "custom-token",
      appUserId: "user-2",
    }));

    const result = await openPlatformSession(
      deps({
        getExistingIdToken: async () => {
          throw new Error("storage unavailable");
        },
        requestCustomToken,
      }),
    );

    expect(requestCustomToken).toHaveBeenCalledWith(undefined);
    expect(result).toMatchObject({ ok: true });
  });

  it("각 단계 실패를 사유로 구분하고 예외를 던지지 않는다", async () => {
    await expect(
      openPlatformSession(
        deps({
          requestCustomToken: async () => {
            throw new Error("bridge down");
          },
        }),
      ),
    ).resolves.toEqual({ ok: false, reason: "custom-token-failed" });

    await expect(
      openPlatformSession(
        deps({
          signInWithCustomToken: async () => {
            throw new Error("auth down");
          },
        }),
      ),
    ).resolves.toEqual({ ok: false, reason: "firebase-sign-in-failed" });

    await expect(
      openPlatformSession(
        deps({
          openSession: async () => {
            throw new Error("platform down");
          },
        }),
      ),
    ).resolves.toEqual({ ok: false, reason: "session-failed" });
  });

  it("세션 실패는 이후 진행을 막지 않는다(호출자가 계속 진행 가능)", async () => {
    const result = await openPlatformSession(
      deps({
        openSession: async () => {
          throw new Error("platform down");
        },
      }),
    );
    expect(result.ok).toBe(false);
    // 결과에 토큰 값이 실려 나가지 않는다.
    expect(JSON.stringify(result)).not.toContain("custom-token");
    expect(JSON.stringify(result)).not.toContain("id-token");
  });

  it("성공 결과에도 토큰 값을 담지 않는다", async () => {
    const result = await openPlatformSession(deps());
    expect(JSON.stringify(result)).not.toContain("custom-token");
    expect(JSON.stringify(result)).not.toContain("id-token");
  });
});
