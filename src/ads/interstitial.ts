import { getLeaderboardPlatform } from "../leaderboard/platform";
import { useTossInterstitialAd, type InterstitialApi } from "../ait/ads";
import { useAdmobInterstitial } from "./admob";

const DISABLED: InterstitialApi = {
  ready: false,
  enabled: false,
  show: async () => false,
};

/**
 * 실행 환경에 맞는 전면광고 백엔드를 고른다.
 * - capacitor-native → Google AdMob
 * - toss → Apps in Toss 통합 광고
 * - web → 없음(no-op)
 *
 * React 훅 규칙상 두 훅을 항상 호출하고, 각 훅은 자기 플랫폼이 아니면 inert하다.
 */
export function useInterstitialAd(enabledByConfig = true): InterstitialApi {
  const toss = useTossInterstitialAd(enabledByConfig);
  const admob = useAdmobInterstitial(enabledByConfig);
  switch (getLeaderboardPlatform()) {
    case "capacitor-native":
      return admob;
    case "toss":
      return toss;
    case "web":
      return DISABLED;
  }
}
