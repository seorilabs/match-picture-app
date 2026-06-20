import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { readItem, writeItem } from "../ait/storage";
import type { Locale } from "./messages";
import {
  LOCALE_STORAGE_KEY,
  detectLocale,
  getLocale,
  isSupportedLocale,
  setLocale as setModuleLocale,
  t as moduleT,
} from "./i18n";
import { I18nContext, type I18nContextValue } from "./i18nContext";

export function I18nProvider({ children }: { children: ReactNode }) {
  // 첫 렌더는 감지값으로 시작하고, 저장된 사용자 선택이 있으면 덮어쓴다.
  const [locale, setLocaleState] = useState<Locale>(() => {
    const detected = detectLocale();
    setModuleLocale(detected);
    return detected;
  });

  useEffect(() => {
    let cancelled = false;
    void readItem(LOCALE_STORAGE_KEY).then((saved) => {
      if (cancelled || !isSupportedLocale(saved)) return;
      setModuleLocale(saved);
      setLocaleState(saved);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setModuleLocale(next);
    setLocaleState(next);
    void writeItem(LOCALE_STORAGE_KEY, next);
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      // locale을 의존성에 넣어 변경 시 t 신원이 바뀌고 소비자가 재렌더된다.
      // moduleT는 항상 최신 currentLocale을 읽으므로 결과는 동일하다.
      t: (key, params) => moduleT(key, params),
    }),
    [locale, setLocale],
  );

  // 모듈 로케일과 상태 동기화 보장(React 밖 t()도 같은 값을 쓰도록).
  useEffect(() => {
    if (getLocale() !== locale) setModuleLocale(locale);
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
