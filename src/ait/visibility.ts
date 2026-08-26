import { useEffect } from "react";

import { onVisibilityChangedByTransparentServiceWeb } from "@apps-in-toss/web-framework";

const HIDDEN_CALLBACK_ID = "match-picture-visibility";
const VISIBLE_CALLBACK_ID = "match-picture-visibility-visible";

function useVisibilityCallback(
  callbackId: string,
  wantVisible: boolean,
  onEvent: () => void,
): void {
  useEffect(() => {
    const handleDocumentVisibility = () => {
      if (document.hidden !== wantVisible) return;
      onEvent();
    };

    document.addEventListener("visibilitychange", handleDocumentVisibility);

    let unregisterBridgeListener: (() => void) | null = null;
    try {
      unregisterBridgeListener = onVisibilityChangedByTransparentServiceWeb({
        options: { callbackId },
        onEvent: (isVisible) => {
          if (isVisible === wantVisible) onEvent();
        },
        onError: () => undefined,
      });
    } catch {
      // Local browser runs do not provide the Apps in Toss visibility bridge.
    }

    return () => {
      document.removeEventListener("visibilitychange", handleDocumentVisibility);
      unregisterBridgeListener?.();
    };
  }, [callbackId, onEvent, wantVisible]);
}

/** 화면이 가려질 때(백그라운드/잠금) 호출됩니다. */
export function useHiddenCallback(onHidden: () => void): void {
  useVisibilityCallback(HIDDEN_CALLBACK_ID, false, onHidden);
}

/** 화면으로 돌아왔을 때 호출됩니다. 날짜 경계 재평가 등에 사용합니다. */
export function useVisibleCallback(onVisible: () => void): void {
  useVisibilityCallback(VISIBLE_CALLBACK_ID, true, onVisible);
}
