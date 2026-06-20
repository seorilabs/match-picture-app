import { useProfile } from "../state/profileContext";
import { useI18n } from "../i18n/i18nContext";
import { CoinBadge } from "../components/CoinBadge";
import {
  FAST_CLEAR_THRESHOLD_SECONDS,
  MISSION_DEFS,
  canClaim,
  isComplete,
} from "../state/missions";

export function MissionsScreen() {
  const { profile, missions, claimMission } = useProfile();
  const { t } = useI18n();

  return (
    <div className="screen missions-screen">
      <header className="screen-header">
        <h1 className="screen-title">{t("missions.title")}</h1>
        <CoinBadge coins={profile.coins} />
      </header>

      <p className="screen-subtitle">{t("missions.subtitle")}</p>

      <ul className="mission-list">
        {MISSION_DEFS.map((def) => {
          const state = missions.states[def.id];
          const complete = isComplete(missions, def.id);
          const claimable = canClaim(missions, def.id);
          return (
            <li key={def.id} className="mission-card">
              <div className="mission-info">
                <span className="mission-label">
                  {t(`mission.${def.id}.label`, {
                    n: FAST_CLEAR_THRESHOLD_SECONDS,
                  })}
                </span>
                <span className="mission-reward">
                  🪙 {def.reward} · {Math.min(state.progress, def.target)}/
                  {def.target}
                </span>
              </div>

              {state.claimed ? (
                <button type="button" className="mission-button is-done" disabled>
                  {t("missions.done")}
                </button>
              ) : claimable ? (
                <button
                  type="button"
                  className="mission-button is-claim"
                  onClick={() => claimMission(def.id)}
                >
                  {t("missions.claim")}
                </button>
              ) : (
                <button type="button" className="mission-button" disabled>
                  {complete ? t("missions.claim") : t("missions.inProgress")}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
