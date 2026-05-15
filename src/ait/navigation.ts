import { useEffect } from "react";

import { closeView, setIosSwipeGestureEnabled } from "@apps-in-toss/web-framework";

export async function closeMiniApp(): Promise<boolean> {
  try {
    await closeView();
    return true;
  } catch {
    // Browser fallback for local development and unsupported bridge contexts.
  }

  if (typeof window !== "undefined" && window.history.length > 1) {
    window.history.back();
    return true;
  }
  return false;
}

export function useDisableIosSwipeBack(active: boolean): void {
  useEffect(() => {
    if (!active) return;

    void setIosSwipeGestureEnabled({ isEnabled: false }).catch(() => {
      // Apps in Toss bridge is not available in local browser runs.
    });

    return () => {
      void setIosSwipeGestureEnabled({ isEnabled: true }).catch(() => {
        // Ignore unsupported bridge contexts.
      });
    };
  }, [active]);
}
