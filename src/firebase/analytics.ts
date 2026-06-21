/**
 * Firebase Analytics(GA4) 어댑터 — Web SDK 기반이라 토스/Capacitor/브라우저 3타겟
 * 모두에서 동작한다. measurementId가 없거나(GA 미활성) 미지원 환경이면 조용히 no-op.
 */
import {
  getAnalytics,
  isSupported,
  logEvent,
  type Analytics,
} from "firebase/analytics";

import { getFirebaseApp } from "./app";
import { firebaseConfig } from "./config";

let analyticsPromise: Promise<Analytics | null> | null = null;

async function getAnalyticsInstance(): Promise<Analytics | null> {
  if (analyticsPromise) return analyticsPromise;
  analyticsPromise = (async () => {
    try {
      if (!firebaseConfig.measurementId) return null;
      if (!(await isSupported())) return null;
      const app = getFirebaseApp();
      if (!app) return null;
      return getAnalytics(app);
    } catch {
      return null;
    }
  })();
  return analyticsPromise;
}

/** 분석 이벤트 1건 기록. 실패/미지원이어도 절대 throw하지 않는다(게임 흐름 보호). */
export async function trackEvent(
  name: string,
  params?: Record<string, string | number | boolean>,
): Promise<void> {
  try {
    const analytics = await getAnalyticsInstance();
    if (!analytics) return;
    logEvent(analytics, name, params);
  } catch {
    // 무시
  }
}
