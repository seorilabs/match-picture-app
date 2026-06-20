import { useI18n } from "../i18n/i18nContext";

export type TabId = "home" | "shop" | "missions" | "settings";

const TABS: { id: TabId; icon: string }[] = [
  { id: "home", icon: "🏠" },
  { id: "shop", icon: "🛒" },
  { id: "missions", icon: "🎯" },
  { id: "settings", icon: "⚙️" },
];

interface TabBarProps {
  active: TabId;
  onChange: (tab: TabId) => void;
}

export function TabBar({ active, onChange }: TabBarProps) {
  const { t } = useI18n();
  return (
    <nav className="tab-bar" role="tablist" aria-label={t("tab.aria")}>
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          className={`tab-item${active === tab.id ? " is-active" : ""}`}
          onClick={() => onChange(tab.id)}
        >
          <span className="tab-icon" aria-hidden="true">
            {tab.icon}
          </span>
          <span className="tab-label">{t(`tab.${tab.id}`)}</span>
        </button>
      ))}
    </nav>
  );
}
