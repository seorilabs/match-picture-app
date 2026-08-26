import { getTossShareLink, share } from "@apps-in-toss/web-framework";

import {
  CHALLENGE_SEED_PARAM,
  CHALLENGE_TARGET_PARAM,
} from "../game/mode";
import { formatSeconds } from "../game/rules";
import { t } from "../i18n/i18n";

/** granite.config.ts의 appName과 같아야 딥링크가 이 미니앱으로 연결됩니다. */
const APP_NAME = "match-picture-app";

export type ShareChallengeResult = "SHARED" | "COPIED" | "ABORTED" | "FAILED";

/** 한 번에 맞힌 라운드/오답이 있던 라운드를 나타내는 이모지. */
export const ROUND_CLEAN_EMOJI = "🟩";
export const ROUND_MISS_EMOJI = "🟥";

export interface ShareChallengeOptions {
  /** 이번 게임 덱을 만든 시드. 받는 쪽이 같은 덱으로 플레이합니다. */
  seed: number;
  /** 도전 대상이 될 클리어 기록(초). */
  seconds: number;
  /** 데일리 모드면 그날 날짜(YYYY-MM-DD). 스포일러 프리 그리드 공유에 사용합니다. */
  dailyDateString?: string;
  /** 라운드별로 한 번에 맞혔는지 여부. */
  roundResults?: readonly boolean[];
}

/** 라운드 결과를 스포일러 없는 이모지 줄로 만듭니다(정답 심볼을 노출하지 않습니다). */
export function buildRoundGrid(roundResults: readonly boolean[]): string {
  return roundResults
    .map((clean) => (clean ? ROUND_CLEAN_EMOJI : ROUND_MISS_EMOJI))
    .join("");
}

/**
 * 데일리 결과 공유 메시지입니다. 날짜·기록·라운드 그리드·링크를 담습니다.
 * 모두가 같은 덱을 푸는 데일리에서만 사용합니다.
 */
export function buildDailyShareMessage(params: {
  dateString: string;
  seconds: number;
  roundResults: readonly boolean[];
  link: string;
}): string {
  const [, month, day] = params.dateString.split("-");
  return t("share.daily.message", {
    date: `${Number(month)}/${Number(day)}`,
    time: formatSeconds(params.seconds),
    grid: buildRoundGrid(params.roundResults),
    link: params.link,
  });
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

function buildMessage(options: ShareChallengeOptions, link: string): string {
  if (options.dailyDateString != null && options.roundResults != null) {
    return buildDailyShareMessage({
      dateString: options.dailyDateString,
      seconds: options.seconds,
      roundResults: options.roundResults,
      link,
    });
  }
  return t("share.message", { time: formatSeconds(options.seconds), link });
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
    await share({ message: buildMessage(options, tossLink) });
    return "SHARED";
  } catch {
    // 브릿지가 없는 브라우저 개발 환경 등에서는 웹 fallback으로 넘어갑니다.
  }

  const fallbackLink = buildWebFallbackLink(query);
  const message = buildMessage(options, fallbackLink);

  try {
    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share({ text: message });
      return "SHARED";
    }
  } catch (error) {
    // 사용자가 직접 공유 시트를 닫은 것이므로 실패도, 클립보드 fallback 대상도 아닙니다.
    if (error instanceof DOMException && error.name === "AbortError") {
      return "ABORTED";
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
