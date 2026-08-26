import { useEffect, useState } from "react";

import { useI18n } from "../i18n/i18nContext";
import { symbolSrc, type SymbolPack } from "../symbols/packs";

interface TutorialModalProps {
  open: boolean;
  /** 장착 중인 팩으로 그려야 실제 게임 화면과 같은 그림을 본다. */
  pack: SymbolPack;
  /** 튜토리얼이 열릴 때 1회 호출(계측/사운드 준비용). */
  onOpen?: () => void;
  /** interactive=true면 직접 정답을 찾아본 뒤 닫은 것. */
  onClose: (interactive: boolean) => void;
}

const COMMON_SYMBOL = "040";
const SAMPLE_TOP = ["048", "007", "021", COMMON_SYMBOL, "023", "028", "033", "054"];
const SAMPLE_BOTTOM = [COMMON_SYMBOL, "002", "053", "047", "056", "027", "020", "044"];

const SAMPLE_POSITIONS = [
  { x: -217, y: 58 },
  { x: 158, y: -93 },
  { x: 84, y: 220 },
  { x: -95, y: 215 },
  { x: 2, y: -224 },
  { x: -169, y: -116 },
  { x: -1, y: 26 },
  { x: 214, y: 70 },
];

function TutorialCard({
  symbols,
  pack,
  highlight,
  hand,
  interactive = false,
  missedSymbol = null,
  onPress,
}: {
  symbols: string[];
  pack: SymbolPack;
  highlight: string | null;
  hand?: boolean;
  interactive?: boolean;
  missedSymbol?: string | null;
  onPress?: (symbol: string) => void;
}) {
  const { t } = useI18n();

  return (
    <div className="tutorial-card">
      {symbols.map((symbol, index) => {
        const position = SAMPLE_POSITIONS[index];
        const isHighlighted = highlight !== null && symbol === highlight;
        const style = {
          left: `${50 + (position.x / 650) * 100}%`,
          top: `${50 - (position.y / 650) * 100}%`,
        };
        const className = `tutorial-symbol${isHighlighted ? " is-highlighted" : ""}${
          missedSymbol === symbol ? " is-missed" : ""
        }`;
        const image = (
          <img src={symbolSrc(pack, symbol)} alt="" draggable={false} />
        );

        if (interactive) {
          return (
            <button
              type="button"
              key={`${symbol}-${index}`}
              className={`${className} is-interactive`}
              style={style}
              aria-label={t("tutorial.aria.symbol", { n: index + 1 })}
              onClick={() => onPress?.(symbol)}
            >
              {image}
            </button>
          );
        }

        return (
          <div className={className} key={`${symbol}-${index}`} style={style}>
            {image}
            {hand && isHighlighted ? (
              <img
                className="tutorial-hand"
                src={`${import.meta.env.BASE_URL}symbols/100.png`}
                alt=""
                draggable={false}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

/**
 * 최초 플레이어가 규칙과 첫 액션을 이해하도록 안내합니다.
 * 읽는 대신 직접 한 번 찾아보게 해서(learn by doing) 실전 첫 라운드의 부담을 줄입니다.
 */
export function TutorialModal({
  open,
  pack,
  onOpen,
  onClose,
}: TutorialModalProps) {
  const { t } = useI18n();
  const [solved, setSolved] = useState(false);
  const [missedSymbol, setMissedSymbol] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSolved(false);
    setMissedSymbol(null);
    onOpen?.();
    // onOpen은 열릴 때 1회만 호출한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const handlePress = (symbol: string) => {
    if (symbol === COMMON_SYMBOL) {
      setMissedSymbol(null);
      setSolved(true);
      return;
    }
    // 실전과 달리 페널티/잠금 없이 시각 피드백만 준다.
    setMissedSymbol(symbol);
  };

  return (
    <div
      className="tutorial-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-title"
    >
      <div className="tutorial-content">
        <div className="tutorial-copy">
          <h1 id="tutorial-title">{t("tutorial.title")}</h1>
          <p>{t("tutorial.body1")}</p>
          <p role="status" aria-live="polite">
            {solved
              ? t("tutorial.correct")
              : missedSymbol !== null
                ? t("tutorial.wrong")
                : t("tutorial.prompt")}
          </p>
        </div>

        <div className="tutorial-cards">
          <TutorialCard
            symbols={SAMPLE_TOP}
            pack={pack}
            highlight={solved ? COMMON_SYMBOL : null}
          />
          <TutorialCard
            symbols={SAMPLE_BOTTOM}
            pack={pack}
            highlight={solved ? COMMON_SYMBOL : null}
            hand={!solved}
            interactive
            missedSymbol={missedSymbol}
            onPress={handlePress}
          />
        </div>

        <div className="tutorial-actions">
          <button
            type="button"
            className="tutorial-start"
            onClick={() => onClose(solved)}
          >
            {solved ? t("tutorial.start") : t("tutorial.skip")}
          </button>
        </div>
      </div>
    </div>
  );
}
