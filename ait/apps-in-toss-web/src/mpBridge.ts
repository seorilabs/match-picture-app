// Godot 이 JavaScriptBridge.get_interface('__mpBridge') 로 집어가는 창구 하나.
//
// 래퍼 안에서는 기능별 런타임이 각자 window.__mpSafeArea / __mpAds / __mpNav 에 붙는다.
// 그것을 그대로 Godot 에 노출하면 Godot 쪽이 창구 네 개를 알아야 하고, 어느 하나가
// 아직 안 붙은 순간을 각자 방어해야 한다. 여기서 하나로 모으고 없는 것은 안전한
// 기본값으로 떨어뜨린다.
//
// Godot 쪽 대응: godot/autoload/platform.gd(is_ait, ait_safe_area_payload),
// godot/src/ui/safe_area.gd(from_ait_payload).

type SafeAreaPayload = {
  left: number
  top: number
  right: number
  bottom: number
  viewportWidth: number
  viewportHeight: number
}

type MpBridge = {
  safeArea: () => SafeAreaPayload
  showInterstitial: () => boolean
  setBackHandler: (handler: () => void) => void
  closeApp: () => void
  // 게임이 첫 화면을 세운 뒤 직접 부른다. 로딩 덮개를 걷는 신호다.
  notifyReady: () => void
}

declare global {
  interface Window {
    __mpBridge?: MpBridge
  }
}

// engine.startGame() 의 Promise 는 게임이 실제로 화면을 세운 시점과 일치하지 않는다.
// 커스텀 Web 템플릿에서는 게임이 멀쩡히 도는데도 풀리지 않아 덮개가 남았다.
// 그래서 준비 완료를 게임 쪽에서 직접 알리게 하고, 래퍼는 그 신호만 기다린다.
let readyResolve: (() => void) | null = null
const readyPromise = new Promise<void>((resolve) => {
  readyResolve = resolve
})

export function whenGameReady(): Promise<void> {
  return readyPromise
}

const EMPTY_SAFE_AREA: SafeAreaPayload = {
  left: 0,
  top: 0,
  right: 0,
  bottom: 0,
  viewportWidth: 0,
  viewportHeight: 0,
}

// 광고는 재시도 버튼에서만 부른다. 원본 Unity 도 RETRY 에서만 전면광고를 띄웠다.
const INTERSTITIAL_PLACEMENT = 'retry'

function readSafeArea(): SafeAreaPayload {
  const state = window.__mpSafeArea
  if (!state) {
    return EMPTY_SAFE_AREA
  }
  // 래퍼는 CSS 픽셀로 들고 있다. Godot 은 논리 뷰포트로 환산해야 하므로
  // 기준이 되는 뷰포트 크기를 함께 넘긴다.
  return {
    left: state.left,
    top: state.top,
    right: state.right,
    bottom: state.bottom,
    viewportWidth: state.vw,
    viewportHeight: state.vh,
  }
}

export function installMpBridge() {
  window.__mpBridge = {
    safeArea: readSafeArea,
    showInterstitial: () => window.__mpAds?.showInterstitial(INTERSTITIAL_PLACEMENT) ?? false,
    setBackHandler: (handler: () => void) => window.__mpNav?.setBackHandler(handler),
    closeApp: () => window.__mpNav?.closeApp(),
    notifyReady: () => readyResolve?.(),
  }
}
