import { generateHapticFeedback } from "@apps-in-toss/web-framework";

export type HapticKind = "correct" | "wrong" | "clear" | "newBest";

/**
 * 게임 이벤트를 Apps in Toss 햅틱 타입으로 매핑합니다.
 * - 정답: 가벼운 긍정 톡톡임
 * - 오답: 에러 진동
 * - 클리어: 성공 진동, 신기록은 confetti로 더 화려하게
 */
const HAPTIC_TYPES: Record<
  HapticKind,
  Parameters<typeof generateHapticFeedback>[0]["type"]
> = {
  correct: "basicWeak",
  wrong: "error",
  clear: "success",
  newBest: "confetti",
};

/**
 * 햅틱 피드백을 시도합니다. 브릿지가 없는 브라우저 등에서는 조용히 무시되며
 * 어떤 경우에도 게임 흐름을 막지 않습니다.
 */
export function triggerHaptic(kind: HapticKind): void {
  try {
    void generateHapticFeedback({ type: HAPTIC_TYPES[kind] }).catch(() => {
      // 미지원 환경은 무시합니다.
    });
  } catch {
    // 브릿지 자체가 없으면 동기로 throw할 수 있으므로 함께 무시합니다.
  }
}
