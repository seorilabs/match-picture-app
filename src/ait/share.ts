import { share } from "@apps-in-toss/web-framework";

/**
 * Apps in Toss `share` 브릿지로 결과 메시지를 공유합니다. 환경에서 지원되지 않으면
 * `false`를 반환하므로 호출자는 적절히 폴백 UI를 보여줄 수 있습니다.
 */
export async function shareScore(seconds: number): Promise<boolean> {
  const message = `같은그림찾기 ${seconds}초 클리어! 더 빠르게 도전해 봐요.`;
  try {
    await share({ message });
    return true;
  } catch {
    return false;
  }
}

/**
 * 환경에 따라 share 함수가 아예 정의되지 않은 경우도 있을 수 있습니다.
 * 호출 전 안전 점검을 위해 boolean을 반환합니다.
 */
export function isShareSupported(): boolean {
  return typeof share === "function";
}
