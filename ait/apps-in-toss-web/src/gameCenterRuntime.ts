// 앱인토스 게임센터 순위표와 네이티브 공유.
//
// Godot 쪽 SDK 호출은 동기다. 여기 SDK 는 Promise 를 돌려주므로 결과를 그대로
// 돌려줄 수 없다. 그래서 "요청을 보냈는가"만 즉시 알려주고, 실제 실패는 콘솔에만
// 남긴다. 순위표 제출이 실패해도 게임 흐름이 멈출 이유가 없다.

import {
  isMinVersionSupported,
  openGameCenterLeaderboard,
  share,
  submitGameCenterLeaderBoardScore,
} from '@apps-in-toss/web-framework'

// 게임센터가 들어온 토스 앱 버전. 이보다 낮으면 호출이 아무 일도 하지 않는다.
const GAME_CENTER_MIN_VERSION = { android: '5.221.0', ios: '5.221.0' } as const

type BridgeResult = 'SUCCESS' | 'UNSUPPORTED' | 'ERROR'

type MpGameCenterBridge = {
  leaderboardSupported: () => boolean
  submitScore: (score: number) => BridgeResult
  openLeaderboard: () => BridgeResult
  shareSupported: () => boolean
  shareText: (message: string) => BridgeResult
}

declare global {
  interface Window {
    __mpGameCenter?: MpGameCenterBridge
  }
}

function supported(): boolean {
  try {
    return Boolean(isMinVersionSupported(GAME_CENTER_MIN_VERSION))
  } catch {
    return false
  }
}

// 게임은 밀리초 정수로 넘긴다(세 마켓이 같은 의미의 점수를 갖게 코어가 정한 형태).
// 게임센터는 실수 문자열만 받으므로 여기서 되돌린다.
function formatScore(score: number): string {
  return (score / 1000).toFixed(3)
}

function warn(action: string, detail: unknown) {
  console.warn(`[leaderboard] ${action}`, detail)
}

export function installMpGameCenterBridge() {
  window.__mpGameCenter = {
    leaderboardSupported: supported,

    submitScore: (score: number): BridgeResult => {
      if (!supported()) {
        return 'UNSUPPORTED'
      }
      try {
        void submitGameCenterLeaderBoardScore({ score: formatScore(score) })
          .then((result) => {
            if (!result) {
              warn('submit skipped', 'unsupported app version')
            } else if (result.statusCode !== 'SUCCESS') {
              warn('submit failed', result.statusCode)
            }
          })
          .catch((error: unknown) => warn('submit threw', error))
        return 'SUCCESS'
      } catch (error) {
        warn('submit threw', error)
        return 'ERROR'
      }
    },

    openLeaderboard: (): BridgeResult => {
      if (!supported()) {
        return 'UNSUPPORTED'
      }
      try {
        void Promise.resolve(openGameCenterLeaderboard()).catch((error: unknown) =>
          warn('open threw', error),
        )
        return 'SUCCESS'
      } catch (error) {
        warn('open threw', error)
        return 'ERROR'
      }
    },

    shareSupported: () => typeof share === 'function',

    shareText: (message: string): BridgeResult => {
      try {
        void Promise.resolve(share({ message })).catch((error: unknown) =>
          warn('share threw', error),
        )
        return 'SUCCESS'
      } catch (error) {
        warn('share threw', error)
        return 'ERROR'
      }
    },
  }
}
