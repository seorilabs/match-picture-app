import { requestReview } from "@apps-in-toss/web-framework";

/**
 * 결과 화면에서 사용자에게 리뷰 요청 모달을 띄울 수 있는 환경이면 호출합니다.
 * 단, Apps in Toss 정책상 너무 잦은 호출은 피해야 하므로 호출자가 빈도를 조절합니다.
 */
export async function requestReviewIfSupported(): Promise<boolean> {
  try {
    if (
      typeof requestReview.isSupported === "function" &&
      !requestReview.isSupported()
    ) {
      return false;
    }
    await requestReview();
    return true;
  } catch {
    return false;
  }
}
