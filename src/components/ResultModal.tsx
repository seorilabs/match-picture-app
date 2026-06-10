import { Modal } from "./Modal";
import type { GameMode } from "../game/mode";
import { formatSeconds } from "../game/rules";

export type ShareStatus = "idle" | "sharing" | "shared" | "copied" | "failed";

interface ResultModalProps {
  open: boolean;
  seconds: number | null;
  mode: GameMode;
  /** 이번 판 시작 전까지의 베스트 기록(초). 없으면 null. */
  previousBestSeconds: number | null;
  /** 이번 판이 신기록인지 여부. */
  isNewBest: boolean;
  /** 도전장 모드에서 이길 대상 기록(초). 없으면 null. */
  challengeTargetSeconds: number | null;
  onRetry: () => void;
  shareStatus: ShareStatus;
  onShare: () => void;
  /** 데일리/도전장 모드에서 클래식으로 돌아갑니다. */
  onPlayClassic: () => void;
  leaderboardEnabled: boolean;
  leaderboardScore: string | null;
  leaderboardSubmitStatus: "idle" | "submitting" | "submitted" | "failed";
  leaderboardStatus: "idle" | "opening" | "failed";
  leaderboardMessage: string | null;
  onOpenLeaderboard: () => void;
  onExit: () => void;
}

const MODE_LABELS: Record<GameMode, string | null> = {
  classic: null,
  daily: "오늘의 도전",
  challenge: "도전장 대결",
};

const SHARE_LABELS: Record<ShareStatus, string> = {
  idle: "SHARE",
  sharing: "...",
  shared: "SENT!",
  copied: "LINK COPIED",
  failed: "SHARE FAILED",
};

/** Unity의 `UIGameResultPopup`을 옮긴 결과 화면입니다. */
export function ResultModal({
  open,
  seconds,
  mode,
  previousBestSeconds,
  isNewBest,
  challengeTargetSeconds,
  onRetry,
  shareStatus,
  onShare,
  onPlayClassic,
  leaderboardEnabled,
  leaderboardScore,
  leaderboardSubmitStatus,
  leaderboardStatus,
  leaderboardMessage,
  onOpenLeaderboard,
  onExit,
}: ResultModalProps) {
  const modeLabel = MODE_LABELS[mode];
  const challengeWon =
    challengeTargetSeconds !== null &&
    seconds !== null &&
    seconds < challengeTargetSeconds;

  return (
    <Modal open={open} variant="result">
      <div className="result-panel">
        {modeLabel ? <div className="result-mode">{modeLabel}</div> : null}
        <div className="result-time">{formatSeconds(seconds ?? 0)}</div>
        {isNewBest ? (
          <div className="result-best is-new" role="status" aria-live="polite">
            NEW BEST!
          </div>
        ) : previousBestSeconds !== null && mode !== "challenge" ? (
          <div className="result-best">
            BEST {formatSeconds(previousBestSeconds)}
          </div>
        ) : null}
        {challengeTargetSeconds !== null ? (
          <div
            className={`result-versus${challengeWon ? " is-win" : ""}`}
            role="status"
            aria-live="polite"
          >
            <span className="result-versus-target">
              상대 기록 {formatSeconds(challengeTargetSeconds)}
            </span>
            <span className="result-versus-outcome">
              {challengeWon ? "WIN!" : "LOSE..."}
            </span>
          </div>
        ) : null}
        {leaderboardEnabled && leaderboardSubmitStatus === "submitting" ? (
          <div
            className="result-score"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            랭킹 등록 중
          </div>
        ) : null}
        {leaderboardEnabled && leaderboardSubmitStatus === "failed" ? (
          <div
            className="result-score"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            랭킹 등록 실패
          </div>
        ) : null}
        {leaderboardEnabled &&
        leaderboardSubmitStatus === "submitted" &&
        leaderboardScore ? (
          <div
            className="result-score"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <span className="result-score-label">랭킹 등록 점수</span>
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
        <button
          type="button"
          className="result-button"
          disabled={shareStatus === "sharing"}
          onClick={onShare}
        >
          {SHARE_LABELS[shareStatus]}
        </button>
        <button type="button" className="result-button" onClick={onRetry}>
          RETRY
        </button>
        {mode !== "classic" ? (
          <button
            type="button"
            className="result-button result-button-secondary"
            onClick={onPlayClassic}
          >
            CLASSIC
          </button>
        ) : null}
        <button type="button" className="result-button" onClick={onExit}>
          EXIT
        </button>
      </div>
    </Modal>
  );
}
