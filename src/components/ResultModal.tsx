import { Modal } from "./Modal";
import { formatSeconds } from "../game/rules";

interface ResultModalProps {
  open: boolean;
  seconds: number | null;
  onRetry: () => void;
  leaderboardEnabled: boolean;
  onOpenLeaderboard: () => void;
  onExit: () => void;
}

/** Unity의 `UIGameResultPopup`을 옮긴 결과 화면입니다. */
export function ResultModal({
  open,
  seconds,
  onRetry,
  leaderboardEnabled,
  onOpenLeaderboard,
  onExit,
}: ResultModalProps) {
  return (
    <Modal open={open} variant="result">
      <div className="result-panel">
        <div className="result-time">{formatSeconds(seconds ?? 0)}</div>
        {leaderboardEnabled ? (
          <button
            type="button"
            className="result-button"
            onClick={onOpenLeaderboard}
          >
            RANKING
          </button>
        ) : null}
        <button type="button" className="result-button" onClick={onRetry}>
          RETRY
        </button>
        <button type="button" className="result-button" onClick={onExit}>
          EXIT
        </button>
      </div>
    </Modal>
  );
}
