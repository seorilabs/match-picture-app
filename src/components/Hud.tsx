import { formatSeconds } from "../game/rules";

interface HudProps {
  remaining: number;
  elapsedSeconds: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

/** Unity 원본 상단 UI처럼 남은 카드와 경과 시간만 보여줍니다. */
export function Hud({
  remaining,
  elapsedSeconds,
  soundEnabled,
  onToggleSound,
}: HudProps) {
  const baseUrl = import.meta.env.BASE_URL;

  return (
    <div className="hud">
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
