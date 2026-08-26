import { useState } from "react";

import { useProfile } from "../state/profileContext";
import { useSettings } from "../state/settingsContext";
import { useI18n } from "../i18n/i18nContext";
import { CoinBadge } from "../components/CoinBadge";
import { StatsModal } from "../components/StatsModal";
import { TutorialModal } from "../components/TutorialModal";
import { SUPPORTED_LOCALES, type Locale } from "../i18n/messages";
import { APP_VERSION } from "../platform/config";

const LOCALE_LABELS: Record<Locale, string> = {
  ko: "한국어",
  en: "English",
};
export function SettingsScreen({ onOpenShop }: { onOpenShop: () => void }) {
  const { profile, equippedPack } = useProfile();
  const {
    soundEnabled,
    hapticsEnabled,
    setSoundEnabled,
    setHapticsEnabled,
  } = useSettings();
  const { t, locale, setLocale } = useI18n();
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);

  const renderToggle = (
    label: string,
    enabled: boolean,
    onChange: (next: boolean) => void,
  ) => (
    <button
      type="button"
      className={`settings-toggle${enabled ? " is-on" : ""}`}
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      onClick={() => onChange(!enabled)}
    >
      {enabled ? t("settings.on") : t("settings.off")}
    </button>
  );

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
          {renderToggle(t("settings.sound"), soundEnabled, setSoundEnabled)}
        </li>
        <li className="settings-row">
          <span>{t("settings.haptics")}</span>
          {renderToggle(t("settings.haptics"), hapticsEnabled, setHapticsEnabled)}
        </li>
        <li className="settings-row">
          <span>{t("settings.theme")}</span>
          <button type="button" className="settings-link" onClick={onOpenShop}>
            {t(`pack.${equippedPack.id}.label`)} · {t("settings.themeGo")}
          </button>
        </li>
        <li className="settings-row">
          <span>{t("settings.tutorial")}</span>
          <button
            type="button"
            className="settings-link"
            onClick={() => setTutorialOpen(true)}
          >
            {t("settings.tutorialAction")}
          </button>
        </li>
        <li className="settings-row">
          <span>{t("settings.stats")}</span>
          <button
            type="button"
            className="settings-link"
            onClick={() => setStatsOpen(true)}
          >
            {t("settings.statsAction")}
          </button>
        </li>
        <li className="settings-row">
          <span>{t("settings.version")}</span>
          <span className="settings-hint">{APP_VERSION}</span>
        </li>
      </ul>

      <TutorialModal
        open={tutorialOpen}
        pack={equippedPack}
        onClose={() => setTutorialOpen(false)}
      />
      <StatsModal
        open={statsOpen}
        classicBestSeconds={null}
        onClose={() => setStatsOpen(false)}
      />
    </div>
  );
}
