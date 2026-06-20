import type { CapacitorConfig } from "@capacitor/cli";

/**
 * 같은그림찾기 네이티브 셸(Capacitor) 설정.
 *
 * - `webDir`는 Vite 빌드 산출물(`dist`)을 가리킨다. Capacitor는 이 디렉토리를
 *   네이티브 앱 번들 안에 복사해 `file://`로 로드하므로 원격 URL을 띄우지 않는다.
 *   (Apple 4.2 "minimum functionality" 회피의 핵심: 로컬 번들 + 오프라인 동작)
 *
 * 식별자 주의:
 * - `appId`는 Capacitor가 단일 값만 받는다. 여기에는 iOS 번들 ID를 넣는다.
 *   iOS App Store 이전받은 기존 앱과 동일: com.github.magicsih.MatchSymbol
 * - Android는 스토어 식별자가 다르므로(com.github.magicsih.MatchPictureUnity)
 *   `android/app/build.gradle`의 `applicationId`에서 override 한다. (namespace는 appId 유지)
 */
const config: CapacitorConfig = {
  appId: "com.github.magicsih.MatchSymbol",
  appName: "같은그림찾기",
  webDir: "dist",
  backgroundColor: "#F4D03F",
  ios: {
    backgroundColor: "#F4D03F",
    contentInset: "never",
  },
  android: {
    backgroundColor: "#F4D03F",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      backgroundColor: "#F4D03F",
    },
  },
};

export default config;
