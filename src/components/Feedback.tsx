import { useMemo, type CSSProperties } from "react";

import type { FeedbackEvent } from "../game/useGame";

interface FeedbackProps {
  event: FeedbackEvent | null;
}

const PARTICLE_COUNT = 10;
const PARTICLE_COLORS = ["#fff000", "#249100", "#ff7f50", "#ffffff", "#6bbdd3"];

interface ParticleStyle extends CSSProperties {
  "--particle-x": string;
  "--particle-y": string;
  "--particle-rotate": string;
}

/** 정답 위치에서 사방으로 튀는 사각 파티클의 이동량을 만듭니다. */
function createParticleStyles(eventId: number): ParticleStyle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, index) => {
    const angle =
      (index / PARTICLE_COUNT) * Math.PI * 2 + Math.random() * 0.6;
    const distance = 56 + Math.random() * 64;
    return {
      "--particle-x": `${Math.cos(angle) * distance}px`,
      "--particle-y": `${Math.sin(angle) * distance}px`,
      "--particle-rotate": `${Math.random() * 540 - 270}deg`,
      backgroundColor:
        PARTICLE_COLORS[(eventId + index) % PARTICLE_COLORS.length],
      animationDelay: `${Math.random() * 60}ms`,
    };
  });
}

/**
 * Unity의 `_textCorrect` / `_textWrong`을 대체하는 짧은 텍스트 피드백입니다.
 * 정답이면 파티클을 함께 터뜨리고, 연속 정답이면 콤보를 보여줍니다.
 * 같은 키 값이 다시 들어와도 React가 재렌더하도록 `event.id`를 element key로 사용합니다.
 */
export function Feedback({ event }: FeedbackProps) {
  const isCorrect = event?.kind === "correct";
  const particles = useMemo(
    () => (event !== null && isCorrect ? createParticleStyles(event.id) : []),
    [event, isCorrect],
  );

  if (event === null) return null;

  const message = isCorrect ? "O" : "X";
  const style = event.origin
    ? {
        left: event.origin.x,
        top: event.origin.y,
      }
    : undefined;

  return (
    <div
      key={event.id}
      className={`feedback-layer ${event.kind}`}
      style={style}
      role="status"
      aria-live="assertive"
    >
      <div className={`feedback ${event.kind}`}>{message}</div>
      {isCorrect && event.combo >= 2 ? (
        <div className="feedback-combo">COMBO x{event.combo}</div>
      ) : null}
      {particles.map((particleStyle, index) => (
        <span
          key={index}
          className="feedback-particle"
          style={particleStyle}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}
