import { submitGameCenterLeaderBoardScore } from "@apps-in-toss/web-framework";

/**
 * Apps in Toss 게임 센터 리더보드에 점수를 제출합니다.
 *
 * 같은그림찾기는 "짧을수록 좋은 시간 기록"이므로 콘솔에서 리더보드 정렬 방향을
 * 오름차순으로 설정해야 자연스럽게 동작합니다. 점수 자체는 초 단위 정수를
 * 문자열로 보냅니다.
 *
 * Apps in Toss 환경이 아니거나 미지원 버전이면 조용히 실패합니다.
 */
export async function submitClearTime(seconds: number): Promise<
  | "SUCCESS"
  | "LEADERBOARD_NOT_FOUND"
  | "PROFILE_NOT_FOUND"
  | "UNPARSABLE_SCORE"
  | "UNSUPPORTED"
  | "ERROR"
> {
  try {
    const result = await submitGameCenterLeaderBoardScore({
      score: String(Math.max(0, Math.floor(seconds))),
    });
    if (!result) return "UNSUPPORTED";
    return result.statusCode;
  } catch {
    return "ERROR";
  }
}
