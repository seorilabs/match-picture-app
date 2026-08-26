/**
 * GA4 게임 권장 이벤트 래퍼입니다.
 *
 * 이름과 파라미터를 한 곳에 모아 GA4 게임 리포트가 채워지는 스키마를 지킵니다.
 * 순수 모듈(src/game, src/state)은 이 파일을 임포트하지 않습니다 — 호출은 화면/어댑터에서 합니다.
 * 참고: https://support.google.com/firebase/answer/9267565
 */
import type { GameMode } from "../game/mode";
import { trackEvent } from "./analytics";

/** 인게임 재화 이름(GA4 virtual_currency_name). */
export const VIRTUAL_CURRENCY = "coin";

export function trackLevelStart(mode: GameMode, difficulty: string): void {
  void trackEvent("level_start", { mode, difficulty });
}

export function trackLevelEnd(params: {
  mode: GameMode;
  difficulty: string;
  seconds: number;
  wrongCount: number;
  maxCombo: number;
  powerUpUseCount: number;
  success?: boolean;
}): void {
  void trackEvent("level_end", {
    mode: params.mode,
    difficulty: params.difficulty,
    success: params.success ?? true,
    seconds: Math.round(params.seconds),
    wrong_count: params.wrongCount,
    max_combo: params.maxCombo,
    power_up_count: params.powerUpUseCount,
  });
}

export function trackPostScore(score: number, mode: GameMode): void {
  void trackEvent("post_score", { score, mode });
}

export function trackTutorialBegin(): void {
  void trackEvent("tutorial_begin");
}

export function trackTutorialComplete(interactive: boolean): void {
  void trackEvent("tutorial_complete", { interactive });
}

export function trackShareResult(result: string): void {
  void trackEvent("share", { method: "challenge", result });
}

export function trackEarnCurrency(source: string, value: number): void {
  if (value <= 0) return;
  void trackEvent("earn_virtual_currency", {
    virtual_currency_name: VIRTUAL_CURRENCY,
    value,
    source,
  });
}

export function trackSpendCurrency(itemName: string, value: number): void {
  if (value <= 0) return;
  void trackEvent("spend_virtual_currency", {
    virtual_currency_name: VIRTUAL_CURRENCY,
    value,
    item_name: itemName,
  });
}

export type AdImpressionResult = "shown" | "failed";

export function trackAdImpression(result: AdImpressionResult): void {
  void trackEvent("ad_impression", {
    ad_format: "interstitial",
    ad_platform: "apps_in_toss",
    result,
  });
}
