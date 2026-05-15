import { useEffect } from "react";

import { onVisibilityChangedByTransparentServiceWeb } from "@apps-in-toss/web-framework";

const VISIBILITY_CALLBACK_ID = "match-picture-visibility";

export function useHiddenCallback(onHidden: () => void): void {
  useEffect(() => {
    const handleDocumentVisibility = () => {
      if (document.hidden) onHidden();
    };

    document.addEventListener("visibilitychange", handleDocumentVisibility);

    let unregisterBridgeListener: (() => void) | null = null;
    try {
      unregisterBridgeListener = onVisibilityChangedByTransparentServiceWeb({
        options: { callbackId: VISIBILITY_CALLBACK_ID },
        onEvent: (isVisible) => {
          if (!isVisible) onHidden();
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
  }, [onHidden]);
}
