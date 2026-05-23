import { Modal } from "./Modal";
import { formatSeconds } from "../game/rules";

interface ResultModalProps {
  open: boolean;
  seconds: number | null;
  onRetry: () => void;
  leaderboardEnabled: boolean;
  leaderboardScore: string | null;
  leaderboardSubmitStatus: "idle" | "submitting" | "submitted" | "failed";
  leaderboardStatus: "idle" | "opening" | "failed";
  leaderboardMessage: string | null;
  onOpenLeaderboard: () => void;
  onExit: () => void;
}

/** Unity의 `UIGameResultPopup`을 옮긴 결과 화면입니다. */
export function ResultModal({
  open,
  seconds,
  onRetry,
  leaderboardEnabled,
  leaderboardScore,
  leaderboardSubmitStatus,
  leaderboardStatus,
  leaderboardMessage,
  onOpenLeaderboard,
  onExit,
}: ResultModalProps) {
  return (
    <Modal open={open} variant="result">
      <div className="result-panel">
        <div className="result-time">{formatSeconds(seconds ?? 0)}</div>
        {leaderboardEnabled && leaderboardSubmitStatus === "submitting" ? (
          <div className="result-score">REGISTERING SCORE</div>
        ) : null}
        {leaderboardEnabled &&
        leaderboardSubmitStatus === "submitted" &&
        leaderboardScore ? (
          <div className="result-score">
            <span className="result-score-label">RANKING SCORE</span>
            <span className="result-score-value">{leaderboardScore}</span>
          </div>
        ) : null}
        {leaderboardEnabled ? (
          <button
            type="button"
            className="result-button"
            disabled={leaderboardStatus === "opening"}
            onClick={onOpenLeaderboard}
          >
            {leaderboardStatus === "opening" ? "OPENING" : "RANKING"}
          </button>
        ) : null}
        {leaderboardStatus === "failed" ? (
          <div className="result-status">
            <span>RANKING UNAVAILABLE</span>
            {leaderboardMessage ? (
              <span className="result-status-detail">{leaderboardMessage}</span>
            ) : null}
          </div>
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
