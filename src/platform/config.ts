/**
 * Platform 연동 설정.
 *
 * `appId`는 seorilabs/platform 레지스트리(`registry/apps/match-picture-app.json`)에 등록된 값과
 * 같아야 custom token bridge가 이 앱의 Firebase 프로젝트로 토큰을 발급한다.
 */

export const PLATFORM_APP_ID = "match-picture-app";

/** 공용 Platform API 호스트. 로컬/스테이징 검증용으로만 env override를 허용한다. */
export const PLATFORM_API_URL =
  import.meta.env.VITE_PLATFORM_API_URL ??
  "https://platform-api-306278488979.asia-northeast3.run.app";
