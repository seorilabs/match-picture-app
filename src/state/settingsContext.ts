import { createContext, useContext } from "react";

import type { HapticKind } from "../ait/haptics";

export interface SettingsContextValue {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  toggleSound: () => void;
  setHapticsEnabled: (enabled: boolean) => void;
  /** 설정이 켜져 있을 때만 실제 햅틱을 울린다. */
  haptic: (kind: HapticKind) => void;
}

export const SettingsContext = createContext<SettingsContextValue | null>(null);

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (ctx === null) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return ctx;
}
