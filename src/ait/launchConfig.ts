/**
 * 운영 스위치 상수.
 *
 * 이 앱의 유일한 백엔드 의존은 GA4 계측이라 원격 설정 소스를 두지 않는다.
 * 따라서 kill-switch와 전면 광고 빈도는 빌드 타임 상수이며, 값을 바꾸려면
 * 재배포가 필요하다.
 */
export interface LaunchConfig {
  leaderboardEnabled: boolean;
  reviewRequestEnabled: boolean;
  interstitialAdEnabled: boolean;
  interstitialMinIntervalSeconds: number;
  interstitialFreeGames: number;
}

export const LAUNCH_CONFIG: LaunchConfig = {
  leaderboardEnabled: true,
  reviewRequestEnabled: true,
  interstitialAdEnabled: true,
  interstitialMinIntervalSeconds: 120,
  interstitialFreeGames: 2,
};
