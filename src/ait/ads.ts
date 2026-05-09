import { useCallback, useEffect, useRef, useState } from "react";

import {
  loadFullScreenAd,
  showFullScreenAd,
} from "@apps-in-toss/web-framework";

/**
 * Vite 환경 변수 `VITE_AD_GROUP_ID`로 광고 그룹 ID를 주입합니다.
 * 값이 없거나 빈 문자열이면 광고 로딩/노출을 시도하지 않습니다.
 */
const AD_GROUP_ID = (import.meta.env.VITE_AD_GROUP_ID ?? "").trim();

interface InterstitialApi {
  /** 현재 광고가 로드되어 있어 노출 가능한 상태인지. */
  ready: boolean;
  /** 노출 가능한 환경(API 자체 지원 + 그룹 ID 설정)인지. */
  enabled: boolean;
  /**
   * 광고가 로드되어 있다면 노출하고 종료까지 기다립니다.
   * 노출 가능 상태가 아니거나 실패하면 즉시 false를 반환합니다.
   */
  show: () => Promise<boolean>;
}

function isInterstitialSupported(): boolean {
  if (AD_GROUP_ID === "") return false;
  try {
    if (typeof loadFullScreenAd.isSupported === "function") {
      return loadFullScreenAd.isSupported();
    }
  } catch {
    return false;
  }
  return true;
}

/**
 * Apps in Toss 통합 광고(전면형) 훅입니다.
 *
 * - 마운트 시 광고를 미리 로드합니다.
 * - `show()` 호출로 노출 후, dismissed 이벤트를 받으면 다음 광고를 다시 로드합니다.
 * - 광고 그룹 ID가 설정되지 않았거나 환경에서 미지원이면 `enabled=false`로 동작합니다.
 *
 * 게임 흐름은 광고 표시 여부와 관계없이 진행되어야 하므로 결과 코드는
 * 단순한 boolean으로만 반환합니다.
 */
export function useInterstitialAd(): InterstitialApi {
  const [ready, setReady] = useState(false);
  const enabled = isInterstitialSupported();
  const unregisterRef = useRef<(() => void) | null>(null);
  const dismissResolversRef = useRef<((value: boolean) => void)[]>([]);

  const loadOnce = useCallback(() => {
    if (!enabled) return;
    if (unregisterRef.current) {
      unregisterRef.current();
      unregisterRef.current = null;
    }
    try {
      const unregister = loadFullScreenAd({
        options: { adGroupId: AD_GROUP_ID },
        onEvent: (event) => {
          if (event.type === "loaded") setReady(true);
        },
        onError: () => {
          setReady(false);
        },
      });
      unregisterRef.current =
        typeof unregister === "function" ? unregister : null;
    } catch {
      setReady(false);
    }
  }, [enabled]);

  useEffect(() => {
    loadOnce();
    return () => {
      if (unregisterRef.current) {
        unregisterRef.current();
        unregisterRef.current = null;
      }
    };
  }, [loadOnce]);

  const show = useCallback<InterstitialApi["show"]>(async () => {
    if (!enabled || !ready) return false;
    setReady(false);
    return new Promise<boolean>((resolve) => {
      dismissResolversRef.current.push(resolve);
      let resolved = false;
      const settle = (value: boolean) => {
        if (resolved) return;
        resolved = true;
        const next = dismissResolversRef.current.shift();
        next?.(value);
        // 다음 광고를 미리 로드합니다.
        loadOnce();
      };
      try {
        const unregister = showFullScreenAd({
          options: { adGroupId: AD_GROUP_ID },
          onEvent: (event) => {
            if (event.type === "dismissed") settle(true);
            if (event.type === "failedToShow") settle(false);
          },
          onError: () => settle(false),
        });
        // 일부 환경에서 unregister가 sync 호출되어도 안전하도록 미사용 처리.
        if (typeof unregister !== "function") {
          // noop
        }
      } catch {
        settle(false);
      }
    });
  }, [enabled, loadOnce, ready]);

  return { ready, enabled, show };
}
