import { describe, expect, it, vi } from "vitest";

const trackEvent = vi.fn();
vi.mock("./analytics", () => ({ trackEvent }));

const { AD_IMPRESSION_EVENT, trackAdImpression } = await import("./gameEvents");

/**
 * GA4는 App 스트림 전용 이름과 예약 이름을 Web 스트림에서 조용히 버린다.
 * 이 앱은 세 표면 모두 Firebase Web SDK로 보내므로, 광고 계측 이름이 그 목록으로
 * 되돌아가면 광고를 켜도 노출량이 0으로 보인다. 실제로 `ad_impression`으로
 * 배포됐다가 수집되지 않은 전례가 있어 이름 자체를 회귀 테스트로 고정한다.
 * https://developers.google.com/analytics/devguides/collection/protocol/ga4/reference
 */
const APP_STREAM_ONLY_EVENTS = ["ad_impression", "in_app_purchase"];
const RESERVED_EVENTS = [
  "ad_activeview",
  "ad_click",
  "ad_exposure",
  "ad_query",
  "ad_reward",
  "adunit_exposure",
  "first_open",
  "first_visit",
  "session_start",
  "user_engagement",
];

describe("trackAdImpression", () => {
  it("does not use a GA4 app-stream-only or reserved event name", () => {
    expect(APP_STREAM_ONLY_EVENTS).not.toContain(AD_IMPRESSION_EVENT);
    expect(RESERVED_EVENTS).not.toContain(AD_IMPRESSION_EVENT);
  });

  it("reports the interstitial outcome with ad context params", () => {
    trackEvent.mockClear();
    trackAdImpression("shown");
    expect(trackEvent).toHaveBeenCalledWith(AD_IMPRESSION_EVENT, {
      ad_format: "interstitial",
      ad_platform: "apps_in_toss",
      result: "shown",
    });

    trackEvent.mockClear();
    trackAdImpression("failed");
    expect(trackEvent).toHaveBeenCalledWith(
      AD_IMPRESSION_EVENT,
      expect.objectContaining({ result: "failed" }),
    );
  });
});
