import { Modal } from "./Modal";
import { PLANT_SPECIES } from "../garden/species";
import { useI18n } from "../i18n/i18nContext";
import { useProfile } from "../state/profileContext";

interface DexModalProps {
  open: boolean;
  onClose: () => void;
}

/** 식물 도감. 수집한 종은 최종 모습으로, 미수집은 실루엣으로 보여준다. */
export function DexModal({ open, onClose }: DexModalProps) {
  const { garden } = useProfile();
  const { t } = useI18n();
  const collected = new Set(garden.collected);

  return (
    <Modal open={open} variant="dex" dismissOnBackdrop onDismiss={onClose}>
      <div className="dex-panel" aria-label={t("dex.title")}>
        <div className="dex-head">
          <strong className="dex-title">{t("dex.title")}</strong>
          <span className="dex-sub">
            {t("dex.subtitle", {
              n: collected.size,
              m: PLANT_SPECIES.length,
            })}
          </span>
        </div>

        <ul className="dex-grid">
          {PLANT_SPECIES.map((species) => {
            const owned = collected.has(species.id);
            const mature = species.stages[species.stages.length - 1];
            return (
              <li
                key={species.id}
                className={`dex-card${owned ? " is-owned" : " is-locked"}`}
              >
                <span className="dex-emoji" aria-hidden="true">
                  {owned ? mature : "❔"}
                </span>
                <span className="dex-name">
                  {owned ? t(`plant.${species.id}.name`) : t("dex.locked")}
                </span>
                <span className="dex-stages" aria-hidden="true">
                  {species.stages.join(" → ")}
                </span>
                <span className="dex-meta">
                  {t("dex.reward", { n: species.reward })}
                </span>
                <span className="dex-meta">
                  {t("dex.water", { n: species.waterPerStage })}
                </span>
              </li>
            );
          })}
        </ul>

        <button type="button" className="result-button" onClick={onClose}>
          {t("common.close")}
        </button>
      </div>
    </Modal>
  );
}
