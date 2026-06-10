import { getTossShareLink, share } from "@apps-in-toss/web-framework";

import {
  CHALLENGE_SEED_PARAM,
  CHALLENGE_TARGET_PARAM,
} from "../game/mode";
import { formatSeconds } from "../game/rules";

/** granite.config.ts의 appName과 같아야 딥링크가 이 미니앱으로 연결됩니다. */
const APP_NAME = "match-picture-app";

export type ShareChallengeResult = "SHARED" | "COPIED" | "FAILED";

export interface ShareChallengeOptions {
  /** 이번 게임 덱을 만든 시드. 받는 쪽이 같은 덱으로 플레이합니다. */
  seed: number;
  /** 도전 대상이 될 클리어 기록(초). */
  seconds: number;
}

export function buildChallengeQuery({
  seed,
  seconds,
}: ShareChallengeOptions): string {
  const params = new URLSearchParams();
  params.set(CHALLENGE_SEED_PARAM, String(seed));
  params.set(CHALLENGE_TARGET_PARAM, seconds.toFixed(2));
  return params.toString();
}

function buildMessage(seconds: number, link: string): string {
  return `같은그림찾기 ${formatSeconds(seconds)} 클리어! 같은 카드로 내 기록을 깨볼래요? ${link}`;
}

function buildWebFallbackLink(query: string): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}${window.location.pathname}?${query}`;
}

/**
 * "내 기록에 도전해봐" 도전장을 공유합니다.
 *
 * 1순위: 토스 공유 링크(`getTossShareLink`) + 네이티브 공유 시트(`share`).
 * 브릿지가 없는 환경에서는 Web Share API, 그것도 없으면 클립보드 복사로
 * 단계적으로 내려갑니다.
 */
export async function shareChallenge(
  options: ShareChallengeOptions,
): Promise<ShareChallengeResult> {
  const query = buildChallengeQuery(options);

  try {
    const tossLink = await getTossShareLink(`intoss://${APP_NAME}?${query}`);
    await share({ message: buildMessage(options.seconds, tossLink) });
    return "SHARED";
  } catch {
    // 브릿지가 없는 브라우저 개발 환경 등에서는 웹 fallback으로 넘어갑니다.
  }

  const fallbackLink = buildWebFallbackLink(query);
  const message = buildMessage(options.seconds, fallbackLink);

  try {
    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share({ text: message });
      return "SHARED";
    }
  } catch (error) {
    // 사용자가 공유 시트를 닫은 경우는 실패로 취급하지 않고 조용히 끝냅니다.
    if (error instanceof DOMException && error.name === "AbortError") {
      return "FAILED";
    }
  }

  try {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(message);
      return "COPIED";
    }
  } catch {
    // fall through
  }

  return "FAILED";
}
