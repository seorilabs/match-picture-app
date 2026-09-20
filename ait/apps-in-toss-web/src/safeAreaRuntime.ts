import { SafeAreaInsets } from '@apps-in-toss/web-framework'

// AppsInToss WebView safe-area insets, bridged to the Godot game so it can keep
// its HUD and top buttons clear of the status bar / notch / home indicator AND
// the framework's fixed top-right controls. Godot's web export cannot read CSS
// env(safe-area-inset-*) or the AIT SDK directly, so we publish the insets (CSS
// px) plus the current viewport size (CSS px) here and let Godot convert to its
// design space. See main.gd `_safe_area_design_insets`.
//
// Robustness: on some devices (observed on Galaxy S25 in the Toss WebView) the
// AIT SDK `SafeAreaInsets.get()` reports 0 even though the canvas renders edge to
// edge under the status bar. We therefore ALSO read the CSS env(safe-area-inset-*)
// values via a probe element (requires viewport-fit=cover on the meta viewport)
// and publish the per-side MAX of the two sources, so a non-zero inset from either
// path reaches the game.

type SafeAreaState = {
  top: number
  bottom: number
  left: number
  right: number
  // Viewport in CSS px, needed by Godot to map CSS insets → design units.
  vw: number
  vh: number
}

declare global {
  interface Window {
    __mpSafeArea?: SafeAreaState
  }
}

// A single, stable object reference. Godot caches the JS interface once and reads
// live values, so we MUTATE this in place rather than reassigning window.__mpSafeArea.
const state: SafeAreaState = { top: 0, bottom: 0, left: 0, right: 0, vw: 0, vh: 0 }

// SDK-reported insets (updated by SafeAreaInsets.subscribe); merged with CSS env().
const sdkInsets = { top: 0, bottom: 0, left: 0, right: 0 }

// Hidden probe whose paddings resolve env(safe-area-inset-*) so we can read them
// as computed px. Kept in the DOM; getComputedStyle reflects live values.
let probe: HTMLDivElement | null = null

function ensureProbe(): HTMLDivElement | null {
  if (probe || typeof document === 'undefined') {
    return probe
  }
  const el = document.createElement('div')
  el.setAttribute('aria-hidden', 'true')
  el.style.cssText = [
    'position:fixed',
    'top:0',
    'left:0',
    'width:0',
    'height:0',
    'visibility:hidden',
    'pointer-events:none',
    'padding-top:env(safe-area-inset-top)',
    'padding-right:env(safe-area-inset-right)',
    'padding-bottom:env(safe-area-inset-bottom)',
    'padding-left:env(safe-area-inset-left)',
  ].join(';')
  document.body.appendChild(el)
  probe = el
  return probe
}

function cssEnvInsets(): { top: number; bottom: number; left: number; right: number } {
  const el = ensureProbe()
  if (!el) {
    return { top: 0, bottom: 0, left: 0, right: 0 }
  }
  const cs = getComputedStyle(el)
  const px = (value: string) => {
    const n = parseFloat(value)
    return Number.isFinite(n) ? n : 0
  }
  return {
    top: px(cs.paddingTop),
    right: px(cs.paddingRight),
    bottom: px(cs.paddingBottom),
    left: px(cs.paddingLeft),
  }
}

function publish() {
  const css = cssEnvInsets()
  state.top = Math.max(sdkInsets.top, css.top)
  state.right = Math.max(sdkInsets.right, css.right)
  state.bottom = Math.max(sdkInsets.bottom, css.bottom)
  state.left = Math.max(sdkInsets.left, css.left)
  state.vw = window.innerWidth
  state.vh = window.innerHeight
}

function applySdk(insets: { top: number; bottom: number; left: number; right: number }) {
  sdkInsets.top = insets.top
  sdkInsets.bottom = insets.bottom
  sdkInsets.left = insets.left
  sdkInsets.right = insets.right
  publish()
}

export function installMpSafeAreaBridge() {
  window.__mpSafeArea = state
  ensureProbe()
  publish()

  try {
    applySdk(SafeAreaInsets.get())
    // Screen-mode changes (rotation, split view) update the insets.
    SafeAreaInsets.subscribe({ onEvent: applySdk })
  } catch {
    // SDK unavailable (plain browser dev / sandbox without the bridge). CSS env()
    // still supplies insets; if that is 0 too, Godot falls back to no-inset layout.
  }

  // Viewport size / env() can change without an SDK event (rotation, keyboard,
  // resize, late layout). Re-read on resize and once after first paint so a late
  // status-bar inset is picked up.
  window.addEventListener('resize', publish)
  requestAnimationFrame(publish)
}
