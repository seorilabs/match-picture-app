// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import App from "../App";

let container: HTMLDivElement;
let root: Root;

async function flush(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
  });
}

describe("앱 부팅 스모크", () => {
  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    window.localStorage.clear();
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  });

  it("홈 화면이 에러 폴백 없이 렌더된다", async () => {
    act(() => root.render(<App />));
    await flush();

    expect(container.querySelector(".error-fallback")).toBeNull();
    expect(container.querySelector(".home-screen")).not.toBeNull();
    // 정원/스트릭/스테이지 진입점이 모두 붙어 있다.
    expect(container.querySelector(".streak-banner")).not.toBeNull();
    expect(container.querySelector(".garden-dex-button")).not.toBeNull();
    expect(container.querySelector(".home-secondary-actions")).not.toBeNull();
  });

  it("게임 시작 버튼을 누르면 게임 화면으로 넘어간다", async () => {
    act(() => root.render(<App />));
    await flush();

    const playButton = container.querySelector(
      ".home-play-button",
    ) as HTMLButtonElement;
    expect(playButton).not.toBeNull();
    act(() => playButton.click());
    await flush();

    expect(container.querySelector(".error-fallback")).toBeNull();
    expect(container.querySelector(".game-shell")).not.toBeNull();
  });

  it("도전장 쿼리는 진입 시 한 번만 소비되고 주소에서 지워진다", async () => {
    window.history.replaceState(
      null,
      "",
      "/?challengeSeed=12345&challengeTarget=20",
    );
    act(() => root.render(<App />));
    await flush();

    expect(window.location.search).toBe("");
    expect(container.querySelector(".game-shell")).not.toBeNull();
  });
});
