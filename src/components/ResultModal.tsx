import { Modal } from "./Modal";
import { bestGapSeconds, isNearMiss } from "../game/bestRecord";
import type { GameMode } from "../game/mode";
import { MAX_DISPLAY_SECONDS, formatSeconds } from "../game/rules";
import { useI18n } from "../i18n/i18nContext";

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
  /** 이번 클리어로 획득한 코인. 없으면 표시하지 않음. */
  earnedCoins: number | null;
  /** 오늘의 도전을 이미 클리어했는지. 클래식 결과에서 데일리 CTA 노출 여부를 정합니다. */
  dailyClearedToday: boolean;
  /** 클래식 결과에서 오늘의 도전으로 이동합니다. */
  onPlayDaily: () => void;
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
  earnedCoins,
  dailyClearedToday,
  onPlayDaily,
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
  const { t } = useI18n();
  const modeLabel =
    mode === "daily"
      ? t("result.daily")
      : mode === "challenge"
        ? t("result.challenge")
        : null;
  const challengeWon =
    challengeTargetSeconds !== null &&
    seconds !== null &&
    seconds < challengeTargetSeconds;
  // 베스트에 못 미친 차이. 아깝게 놓쳤으면 "한 판 더"를 유도하는 강조를 보여줍니다.
  // 표기가 999s로 캡되는 구간에서는 차이 표시가 어긋나 보이므로 함께 숨깁니다.
  const gapVisible =
    seconds !== null && seconds <= MAX_DISPLAY_SECONDS && mode !== "challenge";
  const gapSeconds = gapVisible
    ? bestGapSeconds(seconds, previousBestSeconds)
    : null;
  const nearMiss = gapVisible && isNearMiss(seconds, previousBestSeconds);

  return (
    <Modal open={open} variant="result">
      <div className="result-panel">
        {modeLabel ? <div className="result-mode">{modeLabel}</div> : null}
        <div className="result-time">{formatSeconds(seconds ?? 0)}</div>
        {earnedCoins !== null && earnedCoins > 0 ? (
          <div className="result-coins" role="status" aria-live="polite">
            <span className="result-coins-icon" aria-hidden="true">
              🪙
            </span>
            +{earnedCoins.toLocaleString("ko-KR")}
          </div>
        ) : null}
        {isNewBest ? (
          <div className="result-best is-new" role="status" aria-live="polite">
            NEW BEST!
          </div>
        ) : nearMiss && gapSeconds !== null ? (
          <div
            className="result-best is-near-miss"
            role="status"
            aria-live="polite"
          >
            {t("result.toBest", { n: gapSeconds.toFixed(1) })}
          </div>
        ) : previousBestSeconds !== null && mode !== "challenge" ? (
          <div className="result-best">
            BEST {formatSeconds(previousBestSeconds)}
            {gapSeconds !== null ? (
              <span className="result-best-gap">+{gapSeconds.toFixed(1)}s</span>
            ) : null}
          </div>
        ) : null}
        {challengeTargetSeconds !== null ? (
          <div
            className={`result-versus${challengeWon ? " is-win" : ""}`}
            role="status"
            aria-live="polite"
          >
            <span className="result-versus-target">
              {t("result.rival", { t: formatSeconds(challengeTargetSeconds) })}
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
            {t("result.submitting")}
          </div>
        ) : null}
        {leaderboardEnabled && leaderboardSubmitStatus === "failed" ? (
          <div
            className="result-score"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {t("result.submitFailed")}
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
            <span className="result-score-label">{t("result.scoreLabel")}</span>
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
        {mode === "classic" && !dailyClearedToday ? (
          <button
            type="button"
            className="result-button result-button-daily"
            onClick={onPlayDaily}
          >
            {t("result.dailyCta")}
          </button>
        ) : null}
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
