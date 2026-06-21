/**
 * 네이티브 리더보드용 점수 변환.
 *
 * Apps in Toss 리더보드는 내림차순만 지원해서 `1000 - 초` 형태로 뒤집어 보냈지만
 * (ait/leaderboard.ts 참고), 네이티브 리더보드는 "기록 시간(작을수록 좋음)" 정렬을
 * 그대로 지원하므로 실제 클리어 시간을 정수로 제출한다.
 *
 * - Android(Play Games Services): TIME 형식 리더보드, 단위는 밀리초(ms)
 * - iOS(Game Center): "Elapsed Time - to the hundredth of a second" 형식, 단위는 1/100초
 *
 * 두 플랫폼의 점수 단위가 달라 플랫폼별로 변환한다. 정렬은 양쪽 모두
 * "작을수록 상위(low to high)"로 콘솔에서 설정한다.
 */
export type NativeLeaderboardPlatform = "android" | "ios";

export function clearTimeToNativeScore(
  seconds: number,
  platform: NativeLeaderboardPlatform,
): number {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const unitsPerSecond = platform === "android" ? 1000 : 100;
  return Math.round(safeSeconds * unitsPerSecond);
}
