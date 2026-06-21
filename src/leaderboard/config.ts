/**
 * 네이티브 리더보드 식별자 설정.
 *
 * - Android: Google Play Games Services 콘솔에서 생성한 리더보드 ID (예: "CgkI...")
 * - iOS: App Store Connect Game Center에서 정의한 리더보드 ID
 *   (예: "com.github.magicsih.MatchSymbol.besttime")
 *
 * 리더보드 ID는 비밀이 아니라(클라이언트 번들에 포함됨) 공개 식별자라서 기본값을
 * 박아둔다. 미설정(빈 문자열)이면 해당 플랫폼의 제출/열기는 안전하게 no-op 처리되어
 * 크래시가 나지 않는다. 빌드 시 환경변수로 override 할 수 있다.
 *
 * - android: Play Games Services 리더보드 ID (설정 완료)
 * - ios: Apple Game Center 리더보드 ID (App Store Connect 설정 후 채움)
 */
export const NATIVE_LEADERBOARD = {
  android: import.meta.env.VITE_PGS_LEADERBOARD_ID ?? "CgkI66W6g9cKEAIQAQ",
  ios: import.meta.env.VITE_GAMECENTER_LEADERBOARD_ID ?? "",
} as const;
