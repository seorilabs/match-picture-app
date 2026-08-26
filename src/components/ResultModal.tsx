import { useEffect, useState } from "react";

import { Modal } from "./Modal";
import { bestGapSeconds, isNearMiss } from "../game/bestRecord";
import { formatCountdown, msUntilNextDaily, type GameMode } from "../game/mode";
import { MAX_DISPLAY_SECONDS, formatSeconds } from "../game/rules";
import type { SubmissionBlockReason } from "../game/submission";
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
  /** 이번 판 최대 콤보와 실제 지급액 중 콤보가 늘린 코인. */
  maxCombo: number;
  comboBonusCoins: number;
  /** 이번 판 정답/오답 탭 수. */
  correctCount: number;
  wrongCount: number;
  /** 이번 클리어로 얻은 물방울. */
  earnedDroplets: number;
  /** 기록을 리더보드에 올리지 않은 이유(있으면 안내를 노출). */
  submissionBlockReason: SubmissionBlockReason | null;
  /** 스테이지 모드 결과. */
  stageId: number | null;
  stageStars: number;
  hasNextStage: boolean;
  onNextStage: () => void;
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

const SHARE_LABEL_KEYS: Record<ShareStatus, string> = {
  idle: "result.share.idle",
  sharing: "result.share.sharing",
  shared: "result.share.shared",
  copied: "result.share.copied",
  failed: "result.share.failed",
};

const BLOCK_REASON_KEYS: Partial<Record<SubmissionBlockReason, string>> = {
  "daily-retry": "result.practice",
  "power-up-used": "result.powerUpUnranked",
  "archived-daily": "result.archived",
};

/** 다음 데일리까지 남은 시간을 1초마다 갱신합니다(닫히면 정리). */
function useDailyCountdown(active: boolean): number {
  const [remaining, setRemaining] = useState(() => msUntilNextDaily());

  useEffect(() => {
    if (!active) return;
    setRemaining(msUntilNextDaily());
    const timer = window.setInterval(() => {
      setRemaining(msUntilNextDaily());
    }, 1000);
    return () => window.clearInterval(timer);
  }, [active]);

  return remaining;
}

/** Unity의 `UIGameResultPopup`을 옮긴 결과 화면입니다. */
export function ResultModal({
  open,
  seconds,
  mode,
  previousBestSeconds,
  isNewBest,
  challengeTargetSeconds,
  earnedCoins,
  maxCombo,
  comboBonusCoins,
  correctCount,
  wrongCount,
  earnedDroplets,
  submissionBlockReason,
  stageId,
  stageStars,
  hasNextStage,
  onNextStage,
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
  const showCountdown =
    open && (mode === "daily" || (mode === "classic" && dailyClearedToday));
  const countdownMs = useDailyCountdown(showCountdown);

  const modeLabel =
    mode === "daily"
      ? t("result.daily")
      : mode === "challenge"
        ? t("result.challenge")
        : mode === "stage" && stageId !== null
          ? t("game.stage", { n: stageId })
          : null;
  const challengeWon =
    challengeTargetSeconds !== null &&
    seconds !== null &&
    seconds < challengeTargetSeconds;
  // 베스트에 못 미친 차이. 아깝게 놓쳤으면 "한 판 더"를 유도하는 강조를 보여줍니다.
  // 표기가 999s로 캡되는 구간에서는 차이 표시가 어긋나 보이므로 함께 숨깁니다.
  const gapVisible =
    seconds !== null &&
    seconds <= MAX_DISPLAY_SECONDS &&
    (mode === "classic" || mode === "daily");
  const gapSeconds = gapVisible
    ? bestGapSeconds(seconds, previousBestSeconds)
    : null;
  const nearMiss = gapVisible && isNearMiss(seconds, previousBestSeconds);
  const totalTaps = correctCount + wrongCount;
  const accuracyRate =
    totalTaps > 0 ? Math.round((correctCount / totalTaps) * 100) : null;
  const blockKey =
    submissionBlockReason === null
      ? null
      : (BLOCK_REASON_KEYS[submissionBlockReason] ?? null);

  return (
    <Modal open={open} variant="result">
      <div className="result-panel">
        {modeLabel ? <div className="result-mode">{modeLabel}</div> : null}
        <div className="result-time">{formatSeconds(seconds ?? 0)}</div>
        {mode === "stage" && stageId !== null ? (
          <div className="result-stars" role="status" aria-live="polite">
            {"⭐".repeat(stageStars)}
            {"☆".repeat(Math.max(0, 3 - stageStars))}
            <span className="result-stars-label">
              {t("result.stars", { n: stageStars })}
            </span>
          </div>
        ) : null}
        {accuracyRate !== null ? (
          <div className={`result-accuracy${wrongCount === 0 ? " is-perfect" : ""}`}>
            {wrongCount === 0
              ? t("result.perfect")
              : t("result.accuracy", { rate: accuracyRate, wrong: wrongCount })}
          </div>
        ) : null}
        {earnedCoins !== null && earnedCoins > 0 ? (
          <div className="result-coins" role="status" aria-live="polite">
            <span className="result-coins-icon" aria-hidden="true">
              🪙
            </span>
            +{earnedCoins.toLocaleString("ko-KR")}
          </div>
        ) : null}
        {earnedDroplets > 0 ? (
          <div className="result-droplets">
            {t("result.droplets", { n: earnedDroplets })}
          </div>
        ) : null}
        {earnedCoins !== null ? (
          <div className="result-combo">
            {t("result.comboBonus", {
              combo: maxCombo,
              bonus: comboBonusCoins,
            })}
          </div>
        ) : null}
        {isNewBest ? (
          <div className="result-best is-new" role="status" aria-live="polite">
            {t("result.newBest")}
          </div>
        ) : nearMiss && gapSeconds !== null ? (
          <div
            className="result-best is-near-miss"
            role="status"
            aria-live="polite"
          >
            {t("result.toBest", { n: gapSeconds.toFixed(1) })}
          </div>
        ) : previousBestSeconds !== null && gapVisible ? (
          <div className="result-best">
            {t("result.best", { time: formatSeconds(previousBestSeconds) })}
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
              {challengeWon ? t("result.win") : t("result.lose")}
            </span>
          </div>
        ) : null}
        {showCountdown ? (
          <div className="result-countdown" role="status" aria-live="off">
            {countdownMs <= 0
              ? t("result.dailyOpen")
              : t("result.nextDaily", { time: formatCountdown(countdownMs) })}
          </div>
        ) : null}
        {blockKey !== null ? (
          <div className="result-status result-unranked">{t(blockKey)}</div>
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
            {leaderboardStatus === "opening"
              ? t("result.opening")
              : t("result.ranking")}
          </button>
        ) : null}
        {leaderboardStatus === "failed" ? (
          <div className="result-status">
            <span>{t("result.rankingUnavailable")}</span>
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
          {t(SHARE_LABEL_KEYS[shareStatus])}
        </button>
        {mode === "stage" && hasNextStage ? (
          <button
            type="button"
            className="result-button result-button-daily"
            onClick={onNextStage}
          >
            {t("result.nextStage")}
          </button>
        ) : null}
        <button type="button" className="result-button" onClick={onRetry}>
          {mode === "stage" ? t("result.stageRetry") : t("result.retry")}
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
            {t("result.classic")}
          </button>
        ) : null}
        <button type="button" className="result-button" onClick={onExit}>
          {t("result.exit")}
        </button>
      </div>
    </Modal>
  );
}
