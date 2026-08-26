import { Modal } from "./Modal";
import { formatSeconds } from "../game/rules";
import { useI18n } from "../i18n/i18nContext";
import { useProfile } from "../state/profileContext";
import { accuracy, type TimeBucketId } from "../state/profile";

interface StatsModalProps {
  open: boolean;
  /** 클래식 베스트 기록(초). 없으면 표시하지 않는다. */
  classicBestSeconds: number | null;
  onClose: () => void;
}

const BUCKET_ORDER: TimeBucketId[] = [
  "under15",
  "under20",
  "under30",
  "over30",
];

/** 누적 플레이 통계 뷰. 추적만 되고 버려지던 기록을 보여준다. */
export function StatsModal({
  open,
  classicBestSeconds,
  onClose,
}: StatsModalProps) {
  const { profile } = useProfile();
  const { t } = useI18n();
  const stats = profile.stats;
  const rate = accuracy(stats.correct, stats.wrong);
  const maxBucket = Math.max(
    1,
    ...BUCKET_ORDER.map((bucket) => stats.buckets[bucket]),
  );

  return (
    <Modal open={open} variant="stats" dismissOnBackdrop onDismiss={onClose}>
      <div className="stats-panel" aria-label={t("stats.title")}>
        <strong className="stats-title">{t("stats.title")}</strong>

        {stats.clears === 0 ? (
          <p className="stats-empty">{t("stats.empty")}</p>
        ) : (
          <>
            <ul className="stats-list">
              <li>{t("stats.clears", { n: stats.clears })}</li>
              {rate !== null ? (
                <li>{t("stats.accuracy", { rate: Math.round(rate * 100) })}</li>
              ) : null}
              <li>{t("stats.perfect", { n: stats.perfectClears })}</li>
              <li>
                {t("stats.byMode", {
                  classic: stats.clearsByMode.classic,
                  daily: stats.clearsByMode.daily,
                  stage: stats.clearsByMode.stage,
                })}
              </li>
              {classicBestSeconds !== null ? (
                <li>
                  {t("stats.bestClassic", {
                    time: formatSeconds(classicBestSeconds),
                  })}
                </li>
              ) : null}
            </ul>

            <div className="stats-distribution">
              <span className="stats-subtitle">{t("stats.distribution")}</span>
              {BUCKET_ORDER.map((bucket) => (
                <div className="stats-bar-row" key={bucket}>
                  <span className="stats-bar-label">
                    {t(`stats.bucket.${bucket}`)}
                  </span>
                  <span className="stats-bar-track">
                    <span
                      className="stats-bar-fill"
                      style={{
                        width: `${(stats.buckets[bucket] / maxBucket) * 100}%`,
                      }}
                    />
                  </span>
                  <span className="stats-bar-value">
                    {stats.buckets[bucket]}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        <button type="button" className="result-button" onClick={onClose}>
          {t("common.close")}
        </button>
      </div>
    </Modal>
  );
}
