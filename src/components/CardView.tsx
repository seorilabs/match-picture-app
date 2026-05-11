import { useMemo } from "react";

import { type Card } from "../game/deck";
import { SymbolButton } from "./SymbolButton";

interface CardViewProps {
  card: Card;
  variant: "opponent" | "mine";
  /** 정답 심볼. `mine`일 때만 의미가 있고, 힌트 효과 표시에 사용합니다. */
  hint: string;
  /** 클릭 가능 여부. opponent는 항상 비활성. */
  clickable: boolean;
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

/**
 * 매 라운드 카드가 바뀔 때마다 Unity의 `SetCardWithRotation`처럼 회전/스케일을
 * 랜덤하게 결정합니다. `card` 배열 자체가 키 역할을 하도록 useMemo의 의존성을 잡습니다.
 */
function arrangeSymbols(card: Card): SymbolPlacement[] {
  return card.map((symbol, index) => ({
    symbol,
    rotate: Math.random() * 360 - 180,
    scale: 0.85 + Math.random() * 0.55,
    position: UNITY_SYMBOL_POSITIONS[index],
  }));
}

export function CardView({
  card,
  variant,
  hint,
  clickable,
  onPress,
}: CardViewProps) {
  const placements = useMemo(() => arrangeSymbols(card), [card]);

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
