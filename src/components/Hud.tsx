import { formatSeconds } from "../game/rules";
import { useI18n } from "../i18n/i18nContext";

interface HudProps {
  remaining: number;
  elapsedSeconds: number;
  soundEnabled: boolean;
  leaderboardEnabled: boolean;
  leaderboardStatus: "idle" | "opening" | "failed";
  leaderboardMessage: string | null;
  onToggleSound: () => void;
  onOpenLeaderboard: () => void;
  /** 홈(탭)으로 나가기. */
  onExit: () => void;
}

/** Unity 원본 상단 UI를 기준으로 남은 카드, 경과 시간, 빠른 액션을 보여줍니다. */
export function Hud({
  remaining,
  elapsedSeconds,
  soundEnabled,
  leaderboardEnabled,
  leaderboardStatus,
  leaderboardMessage,
  onToggleSound,
  onOpenLeaderboard,
  onExit,
}: HudProps) {
  const { t } = useI18n();
  const baseUrl = import.meta.env.BASE_URL;
  const leaderboardLabel =
    leaderboardStatus === "opening"
      ? t("hud.aria.openingRanking")
      : leaderboardStatus === "failed" && leaderboardMessage
        ? t("hud.aria.rankingFailed", { msg: leaderboardMessage })
        : t("hud.aria.openRanking");

  return (
    <div className="hud">
      <div className="hud-left">
        <button
          type="button"
          className="hud-exit-toggle"
          aria-label={t("hud.aria.exit")}
          onClick={onExit}
        >
          <span aria-hidden="true">✕</span>
        </button>
        {leaderboardEnabled ? (
          <button
            type="button"
            className={`leaderboard-toggle${
              leaderboardStatus === "failed" ? " is-failed" : ""
            }`}
            aria-label={leaderboardLabel}
            disabled={leaderboardStatus === "opening"}
            onClick={onOpenLeaderboard}
          >
            <span aria-hidden="true">
              {leaderboardStatus === "opening" ? "..." : "RANK"}
            </span>
          </button>
        ) : null}
      </div>
      <div className="hud-stats" role="status" aria-live="polite">
        <div className="hud-group">
          <img
            className="hud-icon hud-icon-card"
            src={`${baseUrl}symbols/102.png`}
            alt=""
            draggable={false}
          />
          <span className="hud-value">{remaining}</span>
        </div>
        <div className="hud-group">
          <img
            className="hud-icon"
            src={`${baseUrl}symbols/101.png`}
            alt=""
            draggable={false}
          />
          <span className="hud-value">{formatSeconds(elapsedSeconds)}</span>
        </div>
      </div>
      <div className="hud-right">
        <button
          type="button"
          className={`sound-toggle${soundEnabled ? " is-on" : ""}`}
          aria-label={
            soundEnabled ? t("hud.aria.soundOff") : t("hud.aria.soundOn")
          }
          aria-pressed={soundEnabled}
          onClick={onToggleSound}
        >
          <span className="sound-glyph" aria-hidden="true">
            <span className="sound-speaker" />
            <span className="sound-wave sound-wave-inner" />
            <span className="sound-wave sound-wave-outer" />
          </span>
        </button>
      </div>
    </div>
  );
}
