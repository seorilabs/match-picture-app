import { formatSeconds } from "../game/rules";

interface HudProps {
  remaining: number;
  elapsedSeconds: number;
  soundEnabled: boolean;
  leaderboardEnabled: boolean;
  leaderboardStatus: "idle" | "opening" | "failed";
  leaderboardMessage: string | null;
  onToggleSound: () => void;
  onOpenLeaderboard: () => void;
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
}: HudProps) {
  const baseUrl = import.meta.env.BASE_URL;
  const leaderboardLabel =
    leaderboardStatus === "opening"
      ? "랭킹 여는 중"
      : leaderboardStatus === "failed" && leaderboardMessage
        ? `랭킹 열기. 최근 실패: ${leaderboardMessage}`
        : "랭킹 열기";

  return (
    <div className="hud">
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
      <button
        type="button"
        className={`sound-toggle${soundEnabled ? " is-on" : ""}`}
        aria-label={soundEnabled ? "효과음 끄기" : "효과음 켜기"}
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
  );
}
