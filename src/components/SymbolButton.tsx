import { type CSSProperties, type MouseEvent, memo } from "react";

import { type SymbolPack, symbolSrc } from "../symbols/packs";

interface SymbolButtonProps {
  symbol: string;
  /** 심볼을 어떤 테마 에셋으로 그릴지 결정합니다. */
  pack: SymbolPack;
  /** 화면에 보여줄 회전 각도(도). */
  rotate: number;
  /** 화면에 보여줄 스케일 배수. */
  scale: number;
  /** Unity Card.prefab의 650x650 좌표계 기준 위치입니다. */
  position: { x: number; y: number };
  /** 정답이면 true. 힌트 효과 적용 여부 결정. */
  isAnswer?: boolean;
  /** 코인 힌트로 정답을 즉시 강조하는지. */
  powerHintActive?: boolean;
  /** 소거 파워업으로 비활성화한 오답인지. */
  eliminated?: boolean;
  /** 클릭 가능 여부. */
  clickable: boolean;
  /** 클릭 시 호출. */
  onPress: (symbol: string, origin: { x: number; y: number }) => void;
  /** 카드 그룹 식별자. UI 키 충돌 방지용. */
  variant: "opponent" | "mine";
}

/**
 * Unity의 `UIButtonSymbol`에 해당하는 단일 심볼 버튼입니다.
 * 회전/스케일은 Unity `SetCardWithRotation`이 매번 랜덤으로 정하던 것을 그대로 받아서 적용합니다.
 */
function SymbolButtonInner({
  symbol,
  pack,
  rotate,
  scale,
  position,
  isAnswer = false,
  powerHintActive = false,
  eliminated = false,
  clickable,
  onPress,
  variant,
}: SymbolButtonProps) {
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (!clickable || variant !== "mine") return;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    onPress(symbol, {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
  };

  const style: CSSProperties = {
    transform: `rotate(${rotate}deg) scale(${scale})`,
  };
  const buttonStyle: CSSProperties = {
    left: `${50 + (position.x / 650) * 100}%`,
    top: `${50 - (position.y / 650) * 100}%`,
  };

  return (
    <button
      type="button"
      className={`symbol-button${variant === "mine" ? " mine" : ""}${
        isAnswer && variant === "mine" ? " is-answer" : ""
      }${powerHintActive && variant === "mine" ? " is-power-hint" : ""}${
        eliminated && variant === "mine" ? " is-eliminated" : ""
      }`}
      onClick={handleClick}
      disabled={(!clickable || eliminated) && variant === "mine"}
      aria-label={`symbol ${symbol}`}
      style={buttonStyle}
    >
      <img
        className="symbol-image"
        src={symbolSrc(pack, symbol)}
        alt=""
        style={style}
        draggable={false}
      />
    </button>
  );
}

export const SymbolButton = memo(SymbolButtonInner);
