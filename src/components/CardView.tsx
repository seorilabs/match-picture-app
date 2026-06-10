import { type Card } from "../game/deck";
import { SymbolButton } from "./SymbolButton";

interface CardViewProps {
  card: Card;
  variant: "opponent" | "mine";
  /** 정답 심볼. `mine`일 때만 의미가 있고, 힌트 효과 표시에 사용합니다. */
  hint: string;
  /** 클릭 가능 여부. opponent는 항상 비활성. */
  clickable: boolean;
  /**
   * 게임 진행률(0~1). 후반으로 갈수록 심볼 위치를 기본 배치에서 더 멀리 흩뜨려
   * 위치 패턴 암기를 막고 난이도를 올립니다.
   */
  progress?: number;
  onPress: (
    symbol: string,
    origin: { x: number; y: number },
  ) => void;
}

interface SymbolPlacement {
  symbol: string;
  rotate: number;
  scale: number;
  position: { x: number; y: number };
}

const UNITY_SYMBOL_POSITIONS: Array<{ x: number; y: number }> = [
  { x: -217, y: 58 },
  { x: 158, y: -93 },
  { x: 84, y: 220 },
  { x: -95, y: 215 },
  { x: 2, y: -224 },
  { x: -169, y: -116 },
  { x: -1, y: 26 },
  { x: 214, y: 70 },
];

/** Unity Card.prefab 650x650 좌표계에서 심볼 중심이 머물 수 있는 최대 반경. */
const MAX_SYMBOL_RADIUS = 240;

/** 진행률 1일 때 축마다 흔드는 최대 거리(650 좌표계 px). */
const MAX_JITTER = 90;

/** 기본 배치에서 진행률만큼 떨어진 위치를 만들되 카드 원 안에 머물게 합니다. */
function jitterPosition(
  base: { x: number; y: number },
  progress: number,
): { x: number; y: number } {
  if (progress <= 0) return base;
  const range = MAX_JITTER * Math.min(1, progress);
  let x = base.x + (Math.random() * 2 - 1) * range;
  let y = base.y + (Math.random() * 2 - 1) * range;
  const distance = Math.hypot(x, y);
  if (distance > MAX_SYMBOL_RADIUS) {
    x = (x / distance) * MAX_SYMBOL_RADIUS;
    y = (y / distance) * MAX_SYMBOL_RADIUS;
  }
  return { x, y };
}

/**
 * 매 라운드 카드가 바뀔 때마다 Unity의 `SetCardWithRotation`처럼 회전/스케일을
 * 랜덤하게 결정합니다.
 */
function arrangeSymbols(card: Card, progress: number): SymbolPlacement[] {
  return card.map((symbol, index) => ({
    symbol,
    rotate: Math.random() * 360 - 180,
    scale: 0.85 + Math.random() * 0.55,
    position: jitterPosition(UNITY_SYMBOL_POSITIONS[index], progress),
  }));
}

/**
 * 카드 배열 참조별 배치 캐시입니다.
 * 룰상 상대 카드가 다음 라운드의 내 카드가 되므로(takeNextRound), 같은 카드가
 * 위에서 아래로 이동할 때 배치가 그대로 유지되어야 "카드가 내려온다"는
 * 전환 연출이 자연스럽습니다.
 */
const placementCache = new WeakMap<Card, SymbolPlacement[]>();

function getPlacements(card: Card, progress: number): SymbolPlacement[] {
  const cached = placementCache.get(card);
  if (cached) return cached;
  const placements = arrangeSymbols(card, progress);
  placementCache.set(card, placements);
  return placements;
}

export function CardView({
  card,
  variant,
  hint,
  clickable,
  progress = 0,
  onPress,
}: CardViewProps) {
  const placements = getPlacements(card, progress);

  return (
    <div className={`card-view ${variant}`}>
      {placements.map((placement, index) => (
        <SymbolButton
          key={`${variant}-${index}-${placement.symbol}`}
          symbol={placement.symbol}
          rotate={placement.rotate}
          scale={placement.scale}
          position={placement.position}
          isAnswer={placement.symbol === hint}
          clickable={clickable}
          onPress={onPress}
          variant={variant}
        />
      ))}
    </div>
  );
}
