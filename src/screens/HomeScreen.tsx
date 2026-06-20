import { useState } from "react";

import type { GameMode } from "../game/mode";
import { useProfile } from "../state/profileContext";
import { useI18n } from "../i18n/i18nContext";
import { CoinBadge } from "../components/CoinBadge";
import { SeedPickerModal } from "../components/SeedPickerModal";
import {
  FERTILIZER_COST,
  isMature,
  plantStageEmoji,
  waterToNextStage,
} from "../state/garden";
import { PLANT_SPECIES, getSpecies } from "../garden/species";

interface HomeScreenProps {
  onStartGame: (mode: GameMode) => void;
}

export function HomeScreen({ onStartGame }: HomeScreenProps) {
  const { profile, garden, waterGarden, removePlant, fertilizePlant } =
    useProfile();
  const { t } = useI18n();
  const [seedOpen, setSeedOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleWater = () => {
    const { reward, matured } = waterGarden();
    setMessage(
      matured > 0
        ? t("home.msg.matured", { n: reward })
        : t("home.msg.watered"),
    );
  };

  const handleFertilize = (index: number) => {
    const result = fertilizePlant(index);
    if (!result.ok) {
      setMessage(t("home.msg.notEnough"));
    } else if (result.reward > 0) {
      setMessage(t("home.msg.fertMatured", { n: result.reward }));
    } else {
      setMessage(t("home.msg.fertilized"));
    }
  };

  return (
    <div className="screen home-screen">
      <header className="screen-header">
        <h1 className="screen-title">{t("home.title")}</h1>
        <CoinBadge coins={profile.coins} />
      </header>

      <section className="garden" aria-label={t("home.aria.garden")}>
        <div className="garden-sky" aria-hidden="true">
          ☀️
        </div>
        <div className="garden-plots">
          {garden.plots.map((plant, index) => {
            if (plant === null) {
              return (
                <button
                  key={index}
                  type="button"
                  className="garden-plot is-empty"
                  onClick={() => setSeedOpen(true)}
                  aria-label={t("home.aria.emptyPlot")}
                >
                  <span className="garden-plot-emoji">＋</span>
                  <span className="garden-plot-caption">{t("home.plant")}</span>
                </button>
              );
            }
            const species = getSpecies(plant.speciesId);
            const mature = isMature(plant, species);
            return (
              <div key={index} className="garden-plot">
                <span className="garden-plot-emoji">
                  {plantStageEmoji(plant)}
                </span>
                <span className="garden-plot-caption">
                  {mature
                    ? t("home.grown")
                    : t("home.waterMore", { n: waterToNextStage(plant) })}
                </span>
                {mature ? (
                  <button
                    type="button"
                    className="garden-plot-remove"
                    onClick={() => removePlant(index)}
                    aria-label={t("home.aria.removePlot", {
                      name: t(`plant.${species.id}.name`),
                    })}
                  >
                    {t("home.clear")}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="garden-plot-fertilize"
                    disabled={profile.coins < FERTILIZER_COST}
                    onClick={() => handleFertilize(index)}
                    aria-label={t("home.aria.fertilize", {
                      name: t(`plant.${species.id}.name`),
                      cost: FERTILIZER_COST,
                    })}
                  >
                    🌿 {FERTILIZER_COST}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="garden-actions">
          <button
            type="button"
            className="garden-water-button"
            disabled={garden.wateredToday}
            onClick={handleWater}
          >
            💧 {garden.wateredToday ? t("home.wateredToday") : t("home.water")}
          </button>
          <button
            type="button"
            className="garden-seed-button"
            onClick={() => setSeedOpen(true)}
          >
            🌰 {t("home.seedButton")}
          </button>
        </div>

        <p className="garden-dex">
          🌼{" "}
          {t("home.dex", {
            n: garden.collected.length,
            m: PLANT_SPECIES.length,
          })}
        </p>
        {message ? <p className="garden-message">{message}</p> : null}
      </section>

      <div className="home-actions">
        <button
          type="button"
          className="primary-button home-play-button"
          onClick={() => onStartGame("classic")}
        >
          ▶ {t("home.play")}
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={() => onStartGame("daily")}
        >
          {t("home.daily")}
        </button>
      </div>

      <SeedPickerModal
        open={seedOpen}
        onClose={() => setSeedOpen(false)}
        onPlanted={(name) => setMessage(t("home.msg.planted", { name }))}
        onFail={(msg) => setMessage(msg)}
      />
    </div>
  );
}
