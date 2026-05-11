interface TutorialModalProps {
  open: boolean;
  onClose: () => void;
}

const SAMPLE_TOP = ["048", "007", "021", "040", "023", "028", "033", "054"];
const SAMPLE_BOTTOM = ["040", "002", "053", "047", "056", "027", "020", "044"];

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
  highlight,
  hand,
}: {
  symbols: string[];
  highlight: string;
  hand?: boolean;
}) {
  const baseUrl = import.meta.env.BASE_URL;

  return (
    <div className="tutorial-card">
      {symbols.map((symbol, index) => {
        const position = SAMPLE_POSITIONS[index];
        const isHighlighted = symbol === highlight;
        return (
          <div
            className={`tutorial-symbol${isHighlighted ? " is-highlighted" : ""}`}
            key={`${symbol}-${index}`}
            style={{
              left: `${50 + (position.x / 650) * 100}%`,
              top: `${50 - (position.y / 650) * 100}%`,
            }}
          >
            <img
              src={`${baseUrl}symbols/${symbol}.png`}
              alt=""
              draggable={false}
            />
            {hand && isHighlighted ? (
              <img
                className="tutorial-hand"
                src={`${baseUrl}symbols/100.png`}
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

/** Unity 원본의 최초 1회 튜토리얼 화면을 App Store 스크린샷 형태로 재현합니다. */
export function TutorialModal({ open, onClose }: TutorialModalProps) {
  if (!open) return null;

  return (
    <div className="tutorial-overlay" role="dialog" aria-modal="true">
      <div className="tutorial-cards" aria-hidden="true">
        <TutorialCard symbols={SAMPLE_TOP} highlight="040" />
        <TutorialCard symbols={SAMPLE_BOTTOM} highlight="040" hand />
      </div>
      <button
        type="button"
        className="tutorial-close"
        onClick={onClose}
        aria-label="튜토리얼 닫기"
      >
        X
      </button>
    </div>
  );
}
