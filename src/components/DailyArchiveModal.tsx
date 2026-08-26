import { useEffect, useState } from "react";

import { Modal } from "./Modal";
import { readItem } from "../ait/storage";
import {
  dailyBestKey,
  dailyLateClearKey,
  parseBestSeconds,
} from "../game/bestRecord";
import { formatDailyLabel, recentDailyDates } from "../game/mode";
import { formatSeconds } from "../game/rules";
import { useI18n } from "../i18n/i18nContext";

interface DailyArchiveModalProps {
  open: boolean;
  /** KST 기준 오늘 날짜. 당일 클리어와 사후 클리어를 구분하는 기준입니다. */
  today: string;
  onClose: () => void;
  onSelect: (dateString: string) => void;
}

/** 아카이브에 노출할 날짜 수(오늘 포함). */
export const ARCHIVE_DAY_COUNT = 14;

interface ArchiveEntry {
  date: string;
  bestSeconds: number | null;
  late: boolean;
}

/** 지난 데일리 덱을 다시 플레이할 수 있는 캘린더형 목록입니다. */
export function DailyArchiveModal({
  open,
  today,
  onClose,
  onSelect,
}: DailyArchiveModalProps) {
  const { t } = useI18n();
  const [entries, setEntries] = useState<ArchiveEntry[]>([]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const dates = recentDailyDates(ARCHIVE_DAY_COUNT);
    void Promise.all(
      dates.map(async (date) => {
        const [best, late] = await Promise.all([
          readItem(dailyBestKey(date)),
          readItem(dailyLateClearKey(date)),
        ]);
        return {
          date,
          bestSeconds: parseBestSeconds(best),
          late: late === "1",
        } satisfies ArchiveEntry;
      }),
    ).then((loaded) => {
      if (!cancelled) setEntries(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, [open]);

  return (
    <Modal open={open} variant="archive" dismissOnBackdrop onDismiss={onClose}>
      <div className="archive-panel" aria-label={t("archive.title")}>
        <div className="archive-head">
          <strong className="archive-title">{t("archive.title")}</strong>
          <span className="archive-sub">{t("archive.subtitle")}</span>
        </div>

        <ul className="archive-grid">
          {entries.map((entry) => {
            const cleared = entry.bestSeconds !== null;
            return (
              <li key={entry.date}>
                <button
                  type="button"
                  className={`archive-day${cleared ? " is-cleared" : ""}`}
                  onClick={() => onSelect(entry.date)}
                >
                  <span className="archive-date">
                    {entry.date === today
                      ? t("archive.today")
                      : formatDailyLabel(entry.date)}
                  </span>
                  <span className="archive-record">
                    {cleared
                      ? t("archive.cleared", {
                          time: formatSeconds(entry.bestSeconds as number),
                        })
                      : t("archive.notCleared")}
                  </span>
                  {cleared ? (
                    <span
                      className={`archive-badge${entry.late ? " is-late" : ""}`}
                    >
                      {entry.late ? t("archive.late") : t("archive.sameDay")}
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>

        <button type="button" className="result-button" onClick={onClose}>
          {t("common.close")}
        </button>
      </div>
    </Modal>
  );
}
