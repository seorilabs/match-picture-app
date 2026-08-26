import { Modal } from "./Modal";
import {
  MAX_STARS_PER_STAGE,
  STAGES,
  isStageUnlocked,
  starsForStage,
  totalStars,
} from "../game/stages";
import { useI18n } from "../i18n/i18nContext";
import { useProfile } from "../state/profileContext";

interface StageMapModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (stageId: number) => void;
}

/** 순차 해금되는 스테이지 목록. 별점과 목표가 한눈에 보인다. */
export function StageMapModal({ open, onClose, onSelect }: StageMapModalProps) {
  const { profile } = useProfile();
  const { t } = useI18n();
  const progress = profile.stages;

  return (
    <Modal open={open} variant="stage-map" dismissOnBackdrop onDismiss={onClose}>
      <div className="stage-panel" aria-label={t("stage.title")}>
        <div className="stage-head">
          <strong className="stage-title">{t("stage.title")}</strong>
          <span className="stage-sub">{t("stage.subtitle")}</span>
          <span className="stage-total">
            {t("home.stageProgress", {
              n: totalStars(progress),
              m: STAGES.length * MAX_STARS_PER_STAGE,
            })}
          </span>
        </div>

        <ul className="stage-list">
          {STAGES.map((stage) => {
            const unlocked = isStageUnlocked(progress, stage.id);
            const stars = starsForStage(progress, stage.id);
            return (
              <li
                key={stage.id}
                className={`stage-card${unlocked ? "" : " is-locked"}`}
              >
                <div className="stage-info">
                  <span className="stage-name">
                    {t("game.stage", { n: stage.id })}
                  </span>
                  <span className="stage-meta">
                    {t("stage.rounds", { n: stage.totalCards })} ·{" "}
                    {t("stage.goal", { n: stage.twoStarSeconds })}
                  </span>
                  <span className="stage-stars" aria-hidden="true">
                    {"⭐".repeat(stars)}
                    {"☆".repeat(MAX_STARS_PER_STAGE - stars)}
                  </span>
                </div>
                <button
                  type="button"
                  className="stage-button"
                  disabled={!unlocked}
                  onClick={() => onSelect(stage.id)}
                >
                  {unlocked ? t("stage.play") : t("stage.locked")}
                </button>
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
