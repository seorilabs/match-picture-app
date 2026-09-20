import * as AIT from '@apps-in-toss/web-framework'

// AppsInToss navigation bridge for the Godot game: routes the framework back
// button into the game (so it can open a pause menu / dismiss modals / confirm
// quit) and exposes closeView() so the game can actually exit the mini-app.
//
// The game registers a back handler via window.__mpNav.setBackHandler and
// calls window.__mpNav.closeApp() to quit. If no handler is registered yet
// (game still booting), a back press closes the view — the framework default.

type MpNavBridge = {
  setBackHandler: (handler: () => void) => void
  closeApp: () => void
}

declare global {
  interface Window {
    __mpNav?: MpNavBridge
  }
}

// closeView is a runtime export of the framework but is not in its published
// type surface yet; access it defensively so a missing/renamed export degrades
// to a no-op instead of a hard crash.
function closeMiniApp() {
  const close = (AIT as unknown as { closeView?: () => void }).closeView
  if (typeof close === 'function') {
    close()
  }
}

export function installMpGraniteNavBridge() {
  let backHandler: (() => void) | null = null

  window.__mpNav = {
    setBackHandler: (handler: () => void) => {
      backHandler = handler
    },
    closeApp: closeMiniApp,
  }

  try {
    AIT.graniteEvent.addEventListener('backEvent', {
      onEvent: () => {
        if (backHandler != null) {
          backHandler()
        } else {
          closeMiniApp()
        }
      },
    })
  } catch {
    // Not running inside AppsInToss (plain browser dev) — no back button to wire.
  }
}
