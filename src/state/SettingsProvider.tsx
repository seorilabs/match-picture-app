import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { readItem, writeItem } from "../ait/storage";
import { triggerHaptic, type HapticKind } from "../ait/haptics";
import { stopEffectSounds } from "../audio/effects";
import {
  HAPTICS_STORAGE_KEY,
  SOUND_STORAGE_KEY,
  parseToggle,
  serializeToggle,
} from "./settings";
import { SettingsContext, type SettingsContextValue } from "./settingsContext";

/**
 * 사운드/햅틱 설정을 앱 전역에서 공유한다.
 * 게임 화면 HUD 토글과 설정 화면 토글이 같은 상태를 읽고 쓴다.
 */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [soundEnabled, setSoundEnabledState] = useState(true);
  const [hapticsEnabled, setHapticsEnabledState] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      readItem(SOUND_STORAGE_KEY),
      readItem(HAPTICS_STORAGE_KEY),
    ]).then(([sound, haptics]) => {
      if (cancelled) return;
      setSoundEnabledState(parseToggle(sound));
      setHapticsEnabledState(parseToggle(haptics));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setSoundEnabled = useCallback((enabled: boolean) => {
    setSoundEnabledState(enabled);
    if (!enabled) stopEffectSounds();
    void writeItem(SOUND_STORAGE_KEY, serializeToggle(enabled));
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabledState((current) => {
      const next = !current;
      if (!next) stopEffectSounds();
      void writeItem(SOUND_STORAGE_KEY, serializeToggle(next));
      return next;
    });
  }, []);

  const setHapticsEnabled = useCallback((enabled: boolean) => {
    setHapticsEnabledState(enabled);
    void writeItem(HAPTICS_STORAGE_KEY, serializeToggle(enabled));
  }, []);

  const haptic = useCallback(
    (kind: HapticKind) => {
      if (!hapticsEnabled) return;
      triggerHaptic(kind);
    },
    [hapticsEnabled],
  );

  const value = useMemo<SettingsContextValue>(
    () => ({
      soundEnabled,
      hapticsEnabled,
      setSoundEnabled,
      toggleSound,
      setHapticsEnabled,
      haptic,
    }),
    [
      haptic,
      hapticsEnabled,
      setHapticsEnabled,
      setSoundEnabled,
      soundEnabled,
      toggleSound,
    ],
  );

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  );
}
