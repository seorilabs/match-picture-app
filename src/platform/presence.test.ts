// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";

import { Presence } from "@seorilabs/platform-sdk";

import { createPresenceRunner, type PresenceLike } from "./presence";
import { PRESENCE_ENABLED, presenceContext } from "./config";

function spyPresence(): PresenceLike & {
  calls: string[];
} {
  const calls: string[] = [];
  return {
    calls,
    start: () => calls.push("start"),
    stop: () => calls.push("stop"),
    resume: () => calls.push("resume"),
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("presence opt-in", () => {
  it("기본값은 꺼짐이다(중앙 게이트 통과 전)", () => {
    expect(PRESENCE_ENABLED).toBe(false);
  });

  it("비활성이면 Presence 객체를 조회조차 하지 않는다(네트워크 0회)", () => {
    const getPresence = vi.fn(() => spyPresence());
    const runner = createPresenceRunner({ enabled: false, getPresence });

    runner.start();
    runner.resume();
    runner.stop();

    expect(getPresence).not.toHaveBeenCalled();
  });

  it("활성이면 lifecycle 호출을 그대로 위임한다", () => {
    const presence = spyPresence();
    const runner = createPresenceRunner({
      enabled: true,
      getPresence: () => presence,
    });

    runner.start();
    runner.resume();
    runner.stop();

    expect(presence.calls).toEqual(["start", "resume", "stop"]);
  });

  it("Presence를 못 만들어도(브릿지/SDK 부재) 조용히 넘어간다", () => {
    const runner = createPresenceRunner({
      enabled: true,
      getPresence: () => null,
    });
    expect(() => {
      runner.start();
      runner.resume();
      runner.stop();
    }).not.toThrow();
  });

  it("Presence가 던져도 호출자에게 전파하지 않는다(fail-open)", () => {
    const runner = createPresenceRunner({
      enabled: true,
      getPresence: () => ({
        start: () => {
          throw new Error("edge down");
        },
        stop: () => {
          throw new Error("edge down");
        },
        resume: () => {
          throw new Error("edge down");
        },
      }),
    });

    expect(() => {
      runner.start();
      runner.resume();
      runner.stop();
    }).not.toThrow();
  });
});

describe("presence context", () => {
  it("표면과 출시 버전만 싣고 PII는 넣지 않는다", () => {
    const context = presenceContext();
    expect(Object.keys(context).sort()).toEqual(["appVersion", "platform"]);
    expect(["android", "ios", "web", "ait"]).toContain(context.platform);
    expect(typeof context.appVersion).toBe("string");
    expect(context.appVersion).not.toBe("");
  });
});

describe("SDK Presence 계약", () => {
  it("비활성 상태에서 start()는 네트워크를 타지 않는다", () => {
    const fetchImpl = vi.fn();
    const presence = new Presence({
      enabled: false,
      tokenTransport: {
        request: async () => {
          throw new Error("token transport should not be used");
        },
      },
      context: presenceContext,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    presence.start();
    presence.resume();
    presence.stop();

    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("Edge가 죽어 있어도 start()가 던지지 않고 즉시 반환한다", async () => {
    const tokenTransport = {
      request: vi.fn(async () => {
        throw new Error("edge bootstrap failed");
      }),
    };
    const presence = new Presence({
      enabled: true,
      tokenTransport,
      context: presenceContext,
      fetchImpl: (async () => {
        throw new Error("network down");
      }) as unknown as typeof fetch,
      // 타이머를 잡아 두어 테스트가 백오프에 매달리지 않게 한다.
      setTimer: (() => 0) as unknown as typeof setTimeout,
      clearTimer: () => undefined,
    });

    expect(() => presence.start()).not.toThrow();
    // 첫 사이클은 호출 흐름에서 await하지 않는다(비동기로 실패하고 조용히 backoff).
    await Promise.resolve();
    await Promise.resolve();
    expect(() => presence.stop()).not.toThrow();
  });
});
