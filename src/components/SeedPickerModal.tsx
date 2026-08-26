import { Modal } from "./Modal";
import { useProfile } from "../state/profileContext";
import { useI18n } from "../i18n/i18nContext";
import { hasEmptyPlot } from "../state/garden";
import { PLANT_SPECIES, getSpecies } from "../garden/species";
import { trackSpendCurrency } from "../firebase/gameEvents";

interface SeedPickerModalProps {
  open: boolean;
  onClose: () => void;
  onPlanted: (name: string) => void;
  onFail: (message: string) => void;
}

/** 코인으로 새 씨앗을 골라 심는 모달. */
export function SeedPickerModal({
  open,
  onClose,
  onPlanted,
  onFail,
}: SeedPickerModalProps) {
  const { profile, garden, plantSeed } = useProfile();
  const { t } = useI18n();
  const canPlant = hasEmptyPlot(garden);

  const handlePlant = (speciesId: string, name: string) => {
    const result = plantSeed(speciesId);
    if (result.ok) {
      trackSpendCurrency(`seed_${speciesId}`, getSpecies(speciesId).seedPrice);
      onPlanted(name);
      onClose();
    } else if (result.reason === "not-enough-coins") {
      onFail(t("home.msg.notEnough"));
    } else if (result.reason === "no-empty-plot") {
      onFail(t("seed.subFull"));
    }
  };

  return (
    <Modal open={open} variant="seed-picker" dismissOnBackdrop onDismiss={onClose}>
      <div className="seed-picker">
        <div className="seed-picker-head">
          <strong className="seed-picker-title">{t("seed.title")}</strong>
          <span className="seed-picker-sub">
            {canPlant ? t("seed.subCan") : t("seed.subFull")}
          </span>
        </div>

        <ul className="seed-list">
          {PLANT_SPECIES.map((species) => {
            const mature = species.stages[species.stages.length - 1];
            const affordable = profile.coins >= species.seedPrice;
            const name = t(`plant.${species.id}.name`);
            return (
              <li key={species.id} className="seed-card">
                <span className="seed-emoji" aria-hidden="true">
                  {mature}
                </span>
                <div className="seed-info">
                  <span className="seed-name">{name}</span>
                  <span className="seed-meta">
                    {t("seed.rewardWhenGrown", { n: species.reward })}
                  </span>
                </div>
                <button
                  type="button"
                  className="seed-button"
                  disabled={!canPlant || !affordable}
                  onClick={() => handlePlant(species.id, name)}
                >
                  {species.seedPrice === 0
                    ? t("seed.free")
                    : `🪙 ${species.seedPrice.toLocaleString()}`}
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
