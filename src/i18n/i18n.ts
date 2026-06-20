/**
 * i18n 코어. 모듈 레벨 currentLocale을 두어 React 밖(예: share.ts)에서도 t()를 쓸 수 있다.
 * React 컴포넌트는 I18nProvider/useI18n으로 로케일 변경 시 재렌더된다.
 */
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  messages,
  type Locale,
} from "./messages";

export const LOCALE_STORAGE_KEY = "match-picture/locale";

export function isSupportedLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" &&
    (SUPPORTED_LOCALES as readonly string[]).includes(value)
  );
}

/** 브라우저/기기 언어로 기본 로케일을 추정한다(한국어면 ko, 그 외 en). */
export function detectLocale(): Locale {
  try {
    const nav = typeof navigator !== "undefined" ? navigator : undefined;
    const candidates = [
      ...(nav?.languages ?? []),
      nav?.language,
    ].filter((v): v is string => typeof v === "string");
    for (const lang of candidates) {
      const base = lang.toLowerCase().split("-")[0];
      if (base === "ko") return "ko";
      if (base === "en") return "en";
    }
  } catch {
    // 무시하고 기본값
  }
  return DEFAULT_LOCALE;
}

let currentLocale: Locale = DEFAULT_LOCALE;

const listeners = new Set<(locale: Locale) => void>();

export function getLocale(): Locale {
  return currentLocale;
}

export function setLocale(locale: Locale): void {
  if (locale === currentLocale) return;
  currentLocale = locale;
  for (const listener of listeners) listener(locale);
}

export function subscribeLocale(listener: (locale: Locale) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export type TParams = Record<string, string | number>;

function interpolate(template: string, params?: TParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in params ? String(params[key]) : match,
  );
}

/** 현재 로케일 기준 번역. 키가 없으면 영어 → 키 자체 순으로 fallback. */
export function t(key: string, params?: TParams): string {
  const dict = messages[currentLocale];
  const template = dict[key] ?? messages[DEFAULT_LOCALE][key] ?? key;
  return interpolate(template, params);
}

/** 특정 로케일로 직접 번역(테스트/SSR 등). */
export function translate(
  locale: Locale,
  key: string,
  params?: TParams,
): string {
  const template =
    messages[locale][key] ?? messages[DEFAULT_LOCALE][key] ?? key;
  return interpolate(template, params);
}
