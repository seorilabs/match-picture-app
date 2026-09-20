// 앱인토스 통합 광고. 래퍼가 SDK 를 다루고 Godot 은 window.__mpAds 로만 부른다.
//
// 이 게임은 전면형 하나만 쓴다. 원본 Unity 도 RETRY 버튼을 눌렀을 때만 전면광고를
// 띄웠고 그 정책을 그대로 옮겼다. 보상형은 쓰지 않는다.
//
// 광고 그룹 ID(VITE_TOSS_INTERSTITIAL_AD_GROUP_ID)가 비면 supported() 가 false 가 되어
// 전부 no-op 으로 떨어진다. 로컬 개발은 광고 없이 돌고, CI 에서 ID 가 비는 것은
// scripts/check-ait-brand-contract.mjs 가 막는다.

import { loadFullScreenAd, showFullScreenAd } from '@apps-in-toss/web-framework'

type MpAdsBridge = {
  showInterstitial: (placement: string) => boolean
}

// 계측 브리지는 Phase 6 에서 붙인다. 그때까지는 없는 채로 도는 것이 정상이라
// 호출부가 전부 optional 이다. 여기서는 모양만 선언해 둔다.
type MpFirebaseBridge = {
  logEvent: (name: string, paramsJson: string) => void
  recordError: (message: string, contextJson: string) => void
}

declare global {
  interface Window {
    __mpAds?: MpAdsBridge
    __mpFirebase?: MpFirebaseBridge
  }
}

const INTERSTITIAL_PLACEMENT = 'retry'
const LOAD_TIMEOUT_MS = 15 * 1000

interface AdSlot {
  placement: string
  loaded: boolean
  loading: boolean
  showing: boolean
  disposeLoad: (() => void) | null
  disposeShow: (() => void) | null
  loadTimeoutId: ReturnType<typeof window.setTimeout> | null
}

const slots = new Map<string, AdSlot>()

export function installMpTossFullScreenAdBridge() {
  window.__mpAds = {
    showInterstitial,
  }
  // Preload every placement up front so they are ready when the game asks.
  preload(INTERSTITIAL_PLACEMENT)
}

function adGroupId(placement: string): string {
  if (placement === INTERSTITIAL_PLACEMENT) {
    return import.meta.env.VITE_TOSS_INTERSTITIAL_AD_GROUP_ID?.trim() || ''
  }
  return ''
}

function supported(placement: string): boolean {
  try {
    return (
      adGroupId(placement) !== '' &&
      loadFullScreenAd.isSupported() &&
      showFullScreenAd.isSupported()
    )
  } catch {
    return false
  }
}

function slotFor(placement: string): AdSlot {
  let slot = slots.get(placement)
  if (!slot) {
    slot = {
      placement,
      loaded: false,
      loading: false,
      showing: false,
      disposeLoad: null,
      disposeShow: null,
      loadTimeoutId: null,
    }
    slots.set(placement, slot)
  }
  return slot
}

function preload(placement: string) {
  if (!supported(placement)) {
    return
  }
  const slot = slotFor(placement)
  if (slot.loaded || slot.loading) {
    return
  }
  slot.loading = true
  slot.disposeLoad?.()
  clearLoadTimeout(slot)
  slot.loadTimeoutId = window.setTimeout(() => {
    if (!slot.loading) {
      return
    }
    slot.loaded = false
    slot.loading = false
    slot.disposeLoad?.()
    slot.disposeLoad = null
    recordAdError(placement, 'load_timeout', new Error('loadFullScreenAd timed out'))
  }, LOAD_TIMEOUT_MS)
  logAdEvent(placement, 'load_requested')
  slot.disposeLoad = loadFullScreenAd({
    options: { adGroupId: adGroupId(placement) },
    onEvent: (event) => {
      if (event.type === 'loaded') {
        slot.loaded = true
        slot.loading = false
        clearLoadTimeout(slot)
        logAdEvent(placement, 'loaded')
      }
    },
    onError: (error) => {
      slot.loaded = false
      slot.loading = false
      clearLoadTimeout(slot)
      recordAdError(placement, 'load_failed', error)
    },
  })
}

function showInterstitial(placement: string): boolean {
  return show(placement)
}

function show(placement: string): boolean {
  if (!supported(placement)) {
    return false
  }
  const slot = slotFor(placement)
  if (!slot.loaded || slot.showing) {
    logAdEvent(placement, slot.showing ? 'show_skipped_showing' : 'show_skipped_not_loaded')
    preload(placement)
    return false
  }

  slot.showing = true
  slot.loaded = false
  // finished 는 종료 처리가 이 노출에서 정확히 한 번만 돌게 막는다.
  let finished = false
  const finish = () => {
    if (finished) {
      return
    }
    finished = true
    slot.showing = false
    slot.disposeShow?.()
    slot.disposeShow = null
    preload(placement) // load → show → load
  }
  slot.disposeShow?.()
  slot.disposeShow = showFullScreenAd({
    options: { adGroupId: adGroupId(placement) },
    onEvent: (event) => {
      logAdEvent(placement, event.type)
      if (event.type === 'dismissed' || event.type === 'failedToShow') {
        finish()
      }
    },
    onError: (error) => {
      recordAdError(placement, 'show_failed', error)
      finish()
    },
  })

  return true
}

function logAdEvent(placement: string, eventType: string, details: Record<string, number | string> = {}) {
  window.__mpFirebase?.logEvent(
    `ait_interstitial_${eventNameSuffix(eventType)}`,
    JSON.stringify({
      placement,
      provider: 'toss_ads',
      ad_group_id: adGroupId(placement),
      event_type: eventType,
      ...details,
    }),
  )
}

function recordAdError(placement: string, stage: string, error: unknown) {
  logAdEvent(placement, stage)
  window.__mpFirebase?.recordError(
    `ait_${placement}_${stage}: ${errorMessage(error)}`,
    JSON.stringify({ placement, provider: 'toss_ads', ad_group_id: adGroupId(placement) }),
  )
}

function eventNameSuffix(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 24)
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

function clearLoadTimeout(slot: AdSlot) {
  if (slot.loadTimeoutId == null) {
    return
  }
  window.clearTimeout(slot.loadTimeoutId)
  slot.loadTimeoutId = null
}
