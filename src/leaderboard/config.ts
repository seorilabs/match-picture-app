/**
 * 네이티브 리더보드 식별자 설정.
 *
 * - Android: Google Play Games Services 콘솔에서 생성한 리더보드 ID (예: "CgkI...")
 * - iOS: App Store Connect Game Center에서 정의한 리더보드 ID
 *   (예: "com.github.magicsih.MatchSymbol.besttime")
 *
 * 두 ID 모두 스토어 콘솔 설정(fast-follow)이 끝난 뒤 채운다. 미설정(빈 문자열)이면
 * 네이티브 제출/열기는 안전하게 no-op 처리되어 크래시가 나지 않는다.
 * 빌드 시 환경변수로 override 할 수 있다.
 */
export const NATIVE_LEADERBOARD = {
  android: import.meta.env.VITE_PGS_LEADERBOARD_ID ?? "",
  ios: import.meta.env.VITE_GAMECENTER_LEADERBOARD_ID ?? "",
} as const;
