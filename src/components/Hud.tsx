import { formatSeconds } from "../game/rules";

interface HudProps {
  remaining: number;
  totalRemaining: number;
  elapsedSeconds: number;
  correctCount: number;
  wrongCount: number;
}

/** 화면 가운데 띠에 들어가는 HUD입니다. 남은 카드, 경과 시간, 정답/오답 카운트를 보여줍니다. */
export function Hud({
  remaining,
  totalRemaining,
  elapsedSeconds,
  correctCount,
  wrongCount,
}: HudProps) {
  return (
    <div className="hud" role="status" aria-live="polite">
      <div className="hud-cell">
        <span className="hud-label">남은 카드</span>
        <span className="hud-value">
          {remaining}
          <span className="hud-suffix">/ {totalRemaining}</span>
        </span>
      </div>
      <div className="hud-cell hud-cell-time">
        <span className="hud-label">기록</span>
        <span className="hud-value">{formatSeconds(elapsedSeconds)}</span>
      </div>
      <div className="hud-cell">
        <span className="hud-label">정답 · 오답</span>
        <span className="hud-value">
          <span className="hud-correct">{correctCount}</span>
          <span className="hud-divider">·</span>
          <span className="hud-wrong">{wrongCount}</span>
        </span>
      </div>
    </div>
  );
}
