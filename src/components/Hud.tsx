import { formatSeconds } from "../game/rules";

interface HudProps {
  remaining: number;
  elapsedSeconds: number;
}

/** Unity 원본 상단 UI처럼 남은 카드와 경과 시간만 보여줍니다. */
export function Hud({ remaining, elapsedSeconds }: HudProps) {
  const baseUrl = import.meta.env.BASE_URL;

  return (
    <div className="hud" role="status" aria-live="polite">
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
  );
}
