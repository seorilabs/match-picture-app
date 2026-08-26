import { afterEach, describe, expect, it } from "vitest";

import {
  handleBackPress,
  pushBackHandler,
  resetBackHandlersForTest,
} from "./backButton";

afterEach(() => {
  resetBackHandlersForTest();
});

describe("뒤로가기 핸들러 스택", () => {
  it("가장 최근에 등록된 핸들러가 먼저 처리한다", () => {
    const calls: string[] = [];
    pushBackHandler(() => {
      calls.push("screen");
      return true;
    });
    pushBackHandler(() => {
      calls.push("modal");
      return true;
    });

    expect(handleBackPress()).toBe(true);
    expect(calls).toEqual(["modal"]);
  });

  it("처리하지 않으면 바깥 핸들러로 넘어간다", () => {
    const calls: string[] = [];
    pushBackHandler(() => {
      calls.push("screen");
      return true;
    });
    pushBackHandler(() => {
      calls.push("modal");
      return false;
    });

    expect(handleBackPress()).toBe(true);
    expect(calls).toEqual(["modal", "screen"]);
  });

  it("아무도 처리하지 않으면 false를 돌려준다(앱 백그라운드 전환)", () => {
    expect(handleBackPress()).toBe(false);
  });

  it("해제한 핸들러는 더 이상 호출되지 않는다", () => {
    let called = 0;
    const unregister = pushBackHandler(() => {
      called += 1;
      return true;
    });
    unregister();
    expect(handleBackPress()).toBe(false);
    expect(called).toBe(0);
  });

  it("핸들러가 던져도 뒤로가기 전체가 멈추지 않는다", () => {
    let fallback = 0;
    pushBackHandler(() => {
      fallback += 1;
      return true;
    });
    pushBackHandler(() => {
      throw new Error("boom");
    });

    expect(handleBackPress()).toBe(true);
    expect(fallback).toBe(1);
  });
});
