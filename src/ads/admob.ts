import { useCallback, useEffect, useState } from "react";

import { Capacitor } from "@capacitor/core";
import { AdMob, AdmobConsentStatus } from "@capacitor-community/admob";

import type { InterstitialApi } from "../ait/ads";

/**
 * Google Play(Capacitor 네이티브) 전용 AdMob 전면광고 어댑터.
 *
 * 토스(AIT) 빌드는 `src/ait/ads.ts`의 토스 전면광고를 쓰고, 이 모듈은
 * `Capacitor.isNativePlatform()`이 true일 때만 동작한다. 플랫폼 분기는
 * `src/ads/interstitial.ts`가 담당한다.
 *
 * 광고 단위 ID는 `VITE_ADMOB_INTERSTITIAL_ID`로 주입한다. 미설정이면 Google 공식
 * 테스트 광고 단위를 쓰고 `isTesting`을 켠다(실 트래픽 오염/정책 위반 방지).
 */
const TEST_INTERSTITIAL_ID = "ca-app-pub-3940256099942544/1033173712";
const CONFIGURED_ID = (import.meta.env.VITE_ADMOB_INTERSTITIAL_ID ?? "").trim();
const INTERSTITIAL_ID = CONFIGURED_ID || TEST_INTERSTITIAL_ID;
const IS_TESTING = CONFIGURED_ID === "";

function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

let initPromise: Promise<void> | null = null;
function ensureInitialized(): Promise<void> {
  if (!isNative()) return Promise.resolve();
  if (!initPromise) {
    initPromise = (async () => {
      await AdMob.initialize();
      try {
        const info = await AdMob.requestConsentInfo();
        if (
          info.isConsentFormAvailable &&
          info.status === AdmobConsentStatus.REQUIRED
        ) {
          await AdMob.showConsentForm();
        }
      } catch {
        // 동의(UMP) 흐름 실패는 광고 로드와 분리해 무시하고 진행한다.
      }
    })().catch(() => {
      // 초기화 실패 시 다음 호출에서 재시도할 수 있도록 리셋한다.
      initPromise = null;
    });
  }
  return initPromise ?? Promise.resolve();
}

async function prepare(): Promise<boolean> {
  if (!isNative()) return false;
  try {
    await ensureInitialized();
    await AdMob.prepareInterstitial({ adId: INTERSTITIAL_ID, isTesting: IS_TESTING });
    return true;
  } catch {
    return false;
  }
}

async function present(): Promise<boolean> {
  if (!isNative()) return false;
  try {
    await AdMob.showInterstitial();
    return true;
  } catch {
    return false;
  }
}

/**
 * AdMob 전면광고 훅. 시그니처는 토스 훅(`useTossInterstitialAd`)과 동일하다.
 * 네이티브가 아니면 `enabled=false`로 inert하게 동작한다.
 */
export function useAdmobInterstitial(enabledByConfig = true): InterstitialApi {
  const [ready, setReady] = useState(false);
  const enabled = enabledByConfig && isNative();

  useEffect(() => {
    if (!enabled) {
      setReady(false);
      return;
    }
    let cancelled = false;
    void prepare().then((ok) => {
      if (!cancelled) setReady(ok);
    });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const show = useCallback<InterstitialApi["show"]>(async () => {
    if (!enabled || !ready) return false;
    setReady(false);
    const shown = await present();
    // 다음 광고를 미리 로드한다.
    void prepare().then((ok) => setReady(ok));
    return shown;
  }, [enabled, ready]);

  return { ready, enabled, show };
}
