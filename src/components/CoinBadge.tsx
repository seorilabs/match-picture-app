import { useI18n } from "../i18n/i18nContext";

interface CoinBadgeProps {
  coins: number;
}

/** 코인 잔액 배지. 화면 헤더에서 재화를 항상 보여준다. */
export function CoinBadge({ coins }: CoinBadgeProps) {
  const { t } = useI18n();
  return (
    <div className="coin-badge" aria-label={t("coin.aria", { n: coins })}>
      <span className="coin-badge-icon" aria-hidden="true">
        🪙
      </span>
      <span className="coin-badge-amount">{coins.toLocaleString("ko-KR")}</span>
    </div>
  );
}
