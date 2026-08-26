import { type Card } from "../game/deck";
import type { GameMode } from "../game/mode";
import {
  arrangeSymbols,
  placementRng,
  type SymbolPlacement,
} from "../game/placement";
import { type SymbolPack } from "../symbols/packs";
import { SymbolButton } from "./SymbolButton";

interface CardViewProps {
  card: Card;
  variant: "opponent" | "mine";
  /** 심볼 테마. */
  pack: SymbolPack;
  /** 정답 심볼. `mine`일 때만 의미가 있고, 힌트 효과 표시에 사용합니다. */
  hint: string;
  /** 이번 게임 덱 시드. 배치를 결정적으로 만드는 근거입니다. */
  deckSeed: number | null;
  /** 카드 테두리 색을 모드별로 구분합니다. */
  mode?: GameMode;
  /** 코인 힌트로 정답을 즉시 강조하는지. */
  powerUpHintActive?: boolean;
  /** 코인 소거로 현재 라운드에서 비활성화한 오답 심볼. */
  eliminatedSymbols?: readonly string[];
  /** 클릭 가능 여부. opponent는 항상 비활성. */
  clickable: boolean;
  /**
   * 게임 진행률(0~1). 후반으로 갈수록 심볼 위치를 기본 배치에서 더 멀리 흩뜨려
   * 위치 패턴 암기를 막고 난이도를 올립니다.
   */
  progress?: number;
  /** 난이도별 흩뜨림 배수. */
  jitterScale?: number;
  onPress: (symbol: string, origin: { x: number; y: number }) => void;
}

/**
 * 카드 배열 참조별 배치 캐시입니다.
 * 룰상 상대 카드가 다음 라운드의 내 카드가 되므로(takeNextRound), 같은 카드가
 * 위에서 아래로 이동할 때 배치가 그대로 유지되어야 "카드가 내려온다"는
 * 전환 연출이 자연스럽습니다.
 */
const placementCache = new WeakMap<Card, SymbolPlacement[]>();

function getPlacements(
  card: Card,
  deckSeed: number | null,
  progress: number,
  jitterScale: number,
): SymbolPlacement[] {
  const cached = placementCache.get(card);
  if (cached) return cached;
  // 시드가 아직 없는 상태(첫 렌더 직전)에서도 배치는 만들어져야 하므로 0으로 폴백합니다.
  const placements = arrangeSymbols(card, {
    progress,
    jitterScale,
    rng: placementRng(deckSeed ?? 0, card),
  });
  placementCache.set(card, placements);
  return placements;
}

export function CardView({
  card,
  variant,
  pack,
  hint,
  deckSeed,
  mode = "classic",
  powerUpHintActive = false,
  eliminatedSymbols = [],
  clickable,
  progress = 0,
  jitterScale = 1,
  onPress,
}: CardViewProps) {
  const placements = getPlacements(card, deckSeed, progress, jitterScale);

  return (
    <div className={`card-view ${variant} mode-${mode}`}>
      {placements.map((placement, index) => (
        <SymbolButton
          key={`${variant}-${index}-${placement.symbol}`}
          symbol={placement.symbol}
          pack={pack}
          rotate={placement.rotate}
          scale={placement.scale}
          position={placement.position}
          isAnswer={placement.symbol === hint}
          powerHintActive={powerUpHintActive && placement.symbol === hint}
          eliminated={eliminatedSymbols.includes(placement.symbol)}
          clickable={clickable && !eliminatedSymbols.includes(placement.symbol)}
          onPress={onPress}
          variant={variant}
        />
      ))}
    </div>
  );
}
