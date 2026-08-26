import { useEffect, useState } from "react";

import { CLASSIC_BEST_KEY, dailyBestKey, parseBestSeconds } from "../game/bestRecord";
import { formatCountdown, msUntilNextDaily, type GameMode } from "../game/mode";
import {
  MAX_STARS_PER_STAGE,
  STAGES,
  totalStars,
} from "../game/stages";
import { readItem } from "../ait/storage";
import { useProfile } from "../state/profileContext";
import { useI18n } from "../i18n/i18nContext";
import { CoinBadge } from "../components/CoinBadge";
import { DailyArchiveModal } from "../components/DailyArchiveModal";
import { DexModal } from "../components/DexModal";
import { SeedPickerModal } from "../components/SeedPickerModal";
import { StageMapModal } from "../components/StageMapModal";
import { StatsModal } from "../components/StatsModal";
import {
  FERTILIZER_COST,
  isMature,
  plantStageEmoji,
  waterToNextStage,
} from "../state/garden";
import { streakReward } from "../state/profile";
import { PLANT_SPECIES, getSpecies } from "../garden/species";
import { trackEarnCurrency, trackSpendCurrency } from "../firebase/gameEvents";

interface HomeScreenProps {
  onStartGame: (mode: GameMode) => void;
  onStartStage: (stageId: number) => void;
  onStartArchive: (dateString: string) => void;
}

export function HomeScreen({
  onStartGame,
  onStartStage,
  onStartArchive,
}: HomeScreenProps) {
  const {
    profile,
    today,
    garden,
    waterGarden,
    removePlant,
    fertilizePlant,
    waterWithDroplet,
    claimStreak,
  } = useProfile();
  const { t } = useI18n();
  const [seedOpen, setSeedOpen] = useState(false);
  const [dexOpen, setDexOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [stageOpen, setStageOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [classicBest, setClassicBest] = useState<number | null>(null);
  const [dailyClearedToday, setDailyClearedToday] = useState(false);
  const [countdownMs, setCountdownMs] = useState(() => msUntilNextDaily());

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      readItem(CLASSIC_BEST_KEY),
      readItem(dailyBestKey(today)),
    ]).then(([best, daily]) => {
      if (cancelled) return;
      setClassicBest(parseBestSeconds(best));
      setDailyClearedToday(parseBestSeconds(daily) !== null);
    });
    return () => {
      cancelled = true;
    };
  }, [today]);

  useEffect(() => {
    if (!dailyClearedToday) return;
    setCountdownMs(msUntilNextDaily());
    const timer = window.setInterval(() => {
      setCountdownMs(msUntilNextDaily());
    }, 1000);
    return () => window.clearInterval(timer);
  }, [dailyClearedToday]);

  const streakClaimedToday = profile.streak.lastClaimedDate === today;
  const nextStreakReward = streakReward(profile.streak.count + 1);

  const handleClaimStreak = () => {
    const result = claimStreak();
    if (!result.claimed) return;
    trackEarnCurrency("streak", result.reward);
    setMessage(t("home.msg.streak", { n: result.reward }));
  };

  const handleWater = () => {
    const { reward, matured } = waterGarden();
    if (reward > 0) trackEarnCurrency("garden", reward);
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
      return;
    }
    trackSpendCurrency("fertilizer", FERTILIZER_COST);
    if (result.reward > 0) {
      trackEarnCurrency("garden", result.reward);
      setMessage(t("home.msg.fertMatured", { n: result.reward }));
    } else {
      setMessage(t("home.msg.fertilized"));
    }
  };

  const handleUseDroplet = (index: number) => {
    const result = waterWithDroplet(index);
    if (!result.ok) {
      setMessage(t("home.msg.noDroplet"));
      return;
    }
    if (result.reward > 0) {
      trackEarnCurrency("garden", result.reward);
      setMessage(t("home.msg.dropletMatured", { n: result.reward }));
    } else {
      setMessage(t("home.msg.droplet"));
    }
  };

  return (
    <div className="screen home-screen">
      <header className="screen-header">
        <h1 className="screen-title">{t("home.title")}</h1>
        <CoinBadge coins={profile.coins} />
      </header>

      <section className="streak-banner" aria-label={t("home.streak", { n: profile.streak.count })}>
        <span className="streak-label">
          {t("home.streak", { n: profile.streak.count })}
        </span>
        {streakClaimedToday ? (
          <span className="streak-done">
            {t("home.streakDone", { n: nextStreakReward })}
          </span>
        ) : (
          <button
            type="button"
            className="streak-button"
            onClick={handleClaimStreak}
          >
            {t("home.streakClaim")}
          </button>
        )}
      </section>

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
                  <>
                    <button
                      type="button"
                      className="garden-plot-droplet"
                      disabled={profile.droplets.count <= 0}
                      onClick={() => handleUseDroplet(index)}
                      aria-label={t("home.aria.useDroplet", {
                        name: t(`plant.${species.id}.name`),
                      })}
                    >
                      {t("home.useDroplet")}
                    </button>
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
                  </>
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

        <div className="garden-meta">
          <button
            type="button"
            className="garden-dex-button"
            onClick={() => setDexOpen(true)}
            aria-label={t("home.aria.dex")}
          >
            🌼{" "}
            {t("home.dex", {
              n: garden.collected.length,
              m: PLANT_SPECIES.length,
            })}
          </button>
          <span className="garden-droplets">
            {t("home.droplets", { n: profile.droplets.count })}
          </span>
        </div>
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
          {dailyClearedToday ? ` · ${t("home.dailyDone")}` : ""}
        </button>
        {dailyClearedToday ? (
          <span className="home-daily-countdown">
            {t("home.dailyNext", { time: formatCountdown(countdownMs) })}
          </span>
        ) : null}
        <div className="home-secondary-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => setStageOpen(true)}
          >
            {t("home.stage")} ·{" "}
            {t("home.stageProgress", {
              n: totalStars(profile.stages),
              m: STAGES.length * MAX_STARS_PER_STAGE,
            })}
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => setArchiveOpen(true)}
          >
            {t("home.archive")}
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => setStatsOpen(true)}
          >
            {t("home.stats")}
          </button>
        </div>
      </div>

      <SeedPickerModal
        open={seedOpen}
        onClose={() => setSeedOpen(false)}
        onPlanted={(name) => setMessage(t("home.msg.planted", { name }))}
        onFail={(msg) => setMessage(msg)}
      />
      <DexModal open={dexOpen} onClose={() => setDexOpen(false)} />
      <StatsModal
        open={statsOpen}
        classicBestSeconds={classicBest}
        onClose={() => setStatsOpen(false)}
      />
      <StageMapModal
        open={stageOpen}
        onClose={() => setStageOpen(false)}
        onSelect={(stageId) => {
          setStageOpen(false);
          onStartStage(stageId);
        }}
      />
      <DailyArchiveModal
        open={archiveOpen}
        today={today}
        onClose={() => setArchiveOpen(false)}
        onSelect={(dateString) => {
          setArchiveOpen(false);
          onStartArchive(dateString);
        }}
      />
    </div>
  );
}
