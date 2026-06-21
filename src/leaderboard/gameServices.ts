import { registerPlugin } from "@capacitor/core";

/**
 * standalone 네이티브 앱에서 쓰는 게임 서비스 플러그인 인터페이스.
 *
 * 네이티브 구현:
 * - Android: Google Play Games Services v2 (android/app/.../gameservices/GameServicesPlugin.java)
 * - iOS: GameKit (ios/App/App/GameServices/GameServicesPlugin.swift)
 *
 * 모든 메서드는 미지원/미로그인/미설정 상황에서 throw 하지 않고 의미 있는 결과를
 * 돌려주도록 네이티브 쪽에서 처리한다.
 */
export interface GameServicesPlugin {
  /** 플레이어 인증 및 게임 서비스 사용 가능 여부. */
  isAvailable(): Promise<{ available: boolean }>;
  /** 로그인 시도(Android PGS는 자동, iOS GameKit은 인증 트리거). */
  signIn(): Promise<{ authenticated: boolean }>;
  /** 리더보드에 정수 점수를 제출한다. */
  submitScore(options: {
    leaderboardId: string;
    score: number;
  }): Promise<void>;
  /** 네이티브 리더보드 UI를 연다. */
  showLeaderboard(options: { leaderboardId: string }): Promise<void>;
}

export const GameServices =
  registerPlugin<GameServicesPlugin>("GameServices");
