/**
 * Platform 연동 설정.
 *
 * `appId`는 seorilabs/platform 레지스트리(`registry/apps/match-picture-app.json`)에 등록된 값과
 * 같아야 custom token bridge가 이 앱의 Firebase 프로젝트로 토큰을 발급한다.
 */
import { Capacitor } from "@capacitor/core";
import { getOperationalEnvironment } from "@apps-in-toss/web-framework";
import type { PresenceContext, PresencePlatform } from "@seorilabs/platform-sdk";

export const PLATFORM_APP_ID = "match-picture-app";

/** 공용 Platform API 호스트. 로컬/스테이징 검증용으로만 env override를 허용한다. */
export const PLATFORM_API_URL =
  import.meta.env.VITE_PLATFORM_API_URL ??
  "https://platform-api-306278488979.asia-northeast3.run.app";

/** 릴리스 빌드는 RELEASE_VERSION을 주입하고, 그 외에는 package.json version을 쓴다. */
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || __APP_VERSION__;

/**
 * RPI Edge presence heartbeat 활성 여부.
 *
 * 기본값은 꺼짐이다. 중앙 선행 게이트(seorilabs/platform#78)를 통과한 릴리스 후보에서만
 * `VITE_PLATFORM_PRESENCE=1`로 켠다. 꺼져 있으면 Presence 네트워크 호출이 아예 없다.
 */
export const PRESENCE_ENABLED =
  (import.meta.env.VITE_PLATFORM_PRESENCE ?? "").trim() === "1";

/**
 * 실행 중인 표면을 식별한다.
 * Capacitor 네이티브 셸 → android/ios, 토스 웹뷰 → ait, 그 외 → web.
 */
export function detectPresencePlatform(): PresencePlatform {
  try {
    if (Capacitor.isNativePlatform()) {
      return Capacitor.getPlatform() === "ios" ? "ios" : "android";
    }
  } catch {
    // 브릿지가 없으면 아래 판정으로 넘어간다.
  }
  try {
    // 토스 웹뷰(또는 샌드박스)에서만 호출이 성공한다.
    getOperationalEnvironment();
    return "ait";
  } catch {
    return "web";
  }
}

/**
 * heartbeat에 실리는 실행 환경 정보.
 * 사용자 ID·광고 ID·세션 ID 등 PII는 절대 넣지 않는다(표면과 출시 버전만).
 */
export function presenceContext(): PresenceContext {
  return {
    platform: detectPresencePlatform(),
    appVersion: APP_VERSION,
  };
}
