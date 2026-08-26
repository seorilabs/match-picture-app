// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ErrorBoundary } from "./ErrorBoundary";
import { setLocale } from "../i18n/i18n";
import { messages } from "../i18n/messages";

let container: HTMLDivElement;
let root: Root;

function Boom(): never {
  throw new Error("render failed");
}

describe("ErrorBoundary", () => {
  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    // React가 경계에서 잡은 예외를 콘솔로 다시 던지는 것을 조용히 처리한다.
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.restoreAllMocks();
    globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  });

  it("정상 렌더는 그대로 통과시킨다", () => {
    act(() =>
      root.render(
        <ErrorBoundary>
          <p>ok</p>
        </ErrorBoundary>,
      ),
    );
    expect(container.textContent).toContain("ok");
  });

  it("자식이 렌더 중 throw하면 폴백 UI와 다시 시작 버튼을 보여준다", () => {
    setLocale("ko");
    act(() =>
      root.render(
        <ErrorBoundary>
          <Boom />
        </ErrorBoundary>,
      ),
    );

    expect(container.querySelector(".error-fallback")).not.toBeNull();
    expect(container.textContent).toContain(messages.ko["error.title"]);
    expect(container.textContent).toContain(messages.ko["error.retry"]);
  });
});
