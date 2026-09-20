// Keeps the screen awake while the mini-app is visible so the device does not
// auto-lock during hands-off gameplay (e.g. watching a wash finish). The Godot
// web export cannot request a wake lock itself, so the wrapper holds it.
//
// Uses the Screen Wake Lock API (supported in the Toss Android/iOS WebView). The
// OS releases the lock automatically when the page is hidden, so we re-acquire on
// visibilitychange. Absence of the API degrades to a no-op.

type WakeLockSentinelLike = {
  released: boolean
  release: () => Promise<void>
  addEventListener: (type: 'release', listener: () => void) => void
}

type WakeLockLike = {
  request: (type: 'screen') => Promise<WakeLockSentinelLike>
}

export function installMpScreenWakeBridge() {
  const wakeLock = (navigator as Navigator & { wakeLock?: WakeLockLike }).wakeLock
  if (!wakeLock || typeof document === 'undefined') {
    return
  }

  let sentinel: WakeLockSentinelLike | null = null
  let requesting = false

  async function acquire() {
    if (requesting || (sentinel && !sentinel.released) || document.visibilityState !== 'visible') {
      return
    }
    requesting = true
    try {
      sentinel = await wakeLock!.request('screen')
      // If the OS drops the lock (backgrounding, power events), clear our handle
      // so the next visibility change re-acquires it.
      sentinel.addEventListener('release', () => {
        sentinel = null
      })
    } catch {
      // Denied / unsupported in this context — leave the screen to its default.
      sentinel = null
    } finally {
      requesting = false
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      void acquire()
    }
  })

  void acquire()
}
