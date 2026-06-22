import { useProfile } from "../state/profileContext";
import { useI18n } from "../i18n/i18nContext";
import { CoinBadge } from "../components/CoinBadge";
import { SUPPORTED_LOCALES, type Locale } from "../i18n/messages";

const LOCALE_LABELS: Record<Locale, string> = {
  ko: "한국어",
  en: "English",
};

/**
 * 사운드 토글은 현재 게임 화면(GameScreen)이 소유하고 있어, 추후 전역 설정으로 끌어올린다.
 */
export function SettingsScreen() {
  const { profile } = useProfile();
  const { t, locale, setLocale } = useI18n();

  return (
    <div className="screen settings-screen">
      <header className="screen-header">
        <h1 className="screen-title">{t("settings.title")}</h1>
        <CoinBadge coins={profile.coins} />
      </header>

      <ul className="settings-list">
        <li className="settings-row">
          <span>{t("settings.language")}</span>
          <div
            className="lang-switch"
            role="group"
            aria-label={t("settings.language")}
          >
            {SUPPORTED_LOCALES.map((code) => (
              <button
                key={code}
                type="button"
                aria-pressed={locale === code}
                className={`lang-chip${locale === code ? " is-active" : ""}`}
                onClick={() => setLocale(code)}
              >
                {LOCALE_LABELS[code]}
              </button>
            ))}
          </div>
        </li>
        <li className="settings-row">
          <span>{t("settings.sound")}</span>
          <span className="settings-hint">{t("settings.soundHint")}</span>
        </li>
        <li className="settings-row">
          <span>{t("settings.theme")}</span>
          <span className="settings-hint">{t("settings.themeHint")}</span>
        </li>
        <li className="settings-row">
          <span>{t("settings.version")}</span>
          <span className="settings-hint">1.0.11</span>
        </li>
      </ul>
    </div>
  );
}
