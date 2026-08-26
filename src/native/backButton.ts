/**
 * Android 하드웨어(제스처) 뒤로가기 처리입니다.
 *
 * Capacitor는 JS `backButton` 리스너가 없으면 히스토리 back → 액티비티 종료로 동작합니다.
 * 이 앱은 SPA라 히스토리 스택이 비어 있어서, 게임 중 뒤로가기 한 번에 판이 통째로 날아갑니다.
 * 화면/모달이 자기 핸들러를 등록하고, 아무도 처리하지 않으면 앱을 백그라운드로 보냅니다.
 *
 * 네이티브(Capacitor) 셸에서만 리스너를 붙이므로 AIT 웹뷰/브라우저 동작은 그대로입니다.
 */
import { useEffect, useRef } from "react";

import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

/** 처리했으면 true를 돌려줍니다. false면 더 바깥 핸들러로 넘어갑니다. */
export type BackHandler = () => boolean;

const handlers: BackHandler[] = [];

export function pushBackHandler(handler: BackHandler): () => void {
  handlers.push(handler);
  return () => {
    const index = handlers.lastIndexOf(handler);
    if (index >= 0) handlers.splice(index, 1);
  };
}

/** 가장 최근에 등록된 핸들러부터 처리 기회를 줍니다. */
export function handleBackPress(): boolean {
  for (let i = handlers.length - 1; i >= 0; i--) {
    try {
      if (handlers[i]()) return true;
    } catch {
      // 한 핸들러의 예외가 뒤로가기 전체를 막지 않게 합니다.
    }
  }
  return false;
}

/** 테스트 전용: 등록된 핸들러를 모두 비웁니다. */
export function resetBackHandlersForTest(): void {
  handlers.length = 0;
}

/**
 * 화면 상태에 따라 뒤로가기를 가로챕니다.
 * `active`가 false면 등록하지 않아 우선순위 경쟁이 생기지 않습니다.
 */
export function useBackHandler(active: boolean, handler: BackHandler): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!active) return;
    return pushBackHandler(() => handlerRef.current());
  }, [active]);
}

function isNativeShell(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

/** 앱 시작 시 한 번 호출합니다. 네이티브가 아니면 아무 일도 하지 않습니다. */
export function installNativeBackButton(): void {
  if (!isNativeShell()) return;
  try {
    void CapacitorApp.addListener("backButton", () => {
      if (handleBackPress()) return;
      void CapacitorApp.minimizeApp();
    });
  } catch {
    // 플러그인이 없는 빌드에서는 기본 동작을 유지합니다.
  }
}
