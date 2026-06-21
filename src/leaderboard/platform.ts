import { Capacitor } from "@capacitor/core";

/**
 * 리더보드를 어느 백엔드로 보낼지 판별한다.
 *
 * - "capacitor-native": Capacitor로 감싼 standalone 네이티브 앱(Android/iOS).
 *   Play Games Services / Game Center 네이티브 플러그인을 사용한다.
 * - "toss": Apps in Toss(Granite) WebView 환경. 기존 Toss 게임센터 브리지를 쓴다.
 * - "web": 일반 브라우저(개발/공유 링크 등). 리더보드 없음.
 */
export type LeaderboardPlatform = "capacitor-native" | "toss" | "web";

interface ReactNativeWebViewWindow extends Window {
  ReactNativeWebView?: unknown;
}

export function getLeaderboardPlatform(): LeaderboardPlatform {
  if (Capacitor.isNativePlatform()) return "capacitor-native";
  if (
    typeof window !== "undefined" &&
    (window as ReactNativeWebViewWindow).ReactNativeWebView != null
  ) {
    return "toss";
  }
  return "web";
}
