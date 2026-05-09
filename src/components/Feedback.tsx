import type { FeedbackEvent } from "../game/useGame";

interface FeedbackProps {
  event: FeedbackEvent | null;
}

/**
 * Unity의 `_textCorrect` / `_textWrong`을 대체하는 짧은 텍스트 피드백입니다.
 * 같은 키 값이 다시 들어와도 React가 재렌더하도록 `event.id`를 element key로 사용합니다.
 */
export function Feedback({ event }: FeedbackProps) {
  if (event === null) return null;
  const message = event.kind === "correct" ? "정답!" : "다시!";
  const style = event.origin
    ? {
        left: event.origin.x,
        top: event.origin.y,
      }
    : undefined;
  return (
    <div
      key={event.id}
      className={`feedback ${event.kind}`}
      style={style}
      role="status"
      aria-live="assertive"
    >
      {message}
    </div>
  );
}
