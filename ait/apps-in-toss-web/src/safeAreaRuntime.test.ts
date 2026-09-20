import { afterEach, describe, expect, it, vi } from 'vitest'

const safeAreaMocks = vi.hoisted(() => ({
  get: vi.fn(),
  subscribe: vi.fn(),
}))

vi.mock('@apps-in-toss/web-framework', () => ({
  SafeAreaInsets: safeAreaMocks,
}))

import { installMpSafeAreaBridge } from './safeAreaRuntime.ts'

describe('installMpSafeAreaBridge', () => {
  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
  })

  it('publishes the maximum inset from the SDK and CSS environment', () => {
    const resizeListeners: Array<() => void> = []
    const fakeWindow = {
      innerWidth: 390,
      innerHeight: 844,
      addEventListener: vi.fn((type: string, listener: () => void) => {
        if (type === 'resize') {
          resizeListeners.push(listener)
        }
      }),
    }
    const fakeProbe = {
      setAttribute: vi.fn(),
      style: { cssText: '' },
    }
    const fakeDocument = {
      body: { appendChild: vi.fn() },
      createElement: vi.fn(() => fakeProbe),
    }
    let cssInsets = { top: 36, right: 4, bottom: 18, left: 2 }

    safeAreaMocks.get.mockReturnValue({ top: 24, right: 12, bottom: 8, left: 10 })
    safeAreaMocks.subscribe.mockImplementation(() => undefined)
    vi.stubGlobal('window', fakeWindow)
    vi.stubGlobal('document', fakeDocument)
    vi.stubGlobal('getComputedStyle', () => ({
      paddingTop: `${cssInsets.top}px`,
      paddingRight: `${cssInsets.right}px`,
      paddingBottom: `${cssInsets.bottom}px`,
      paddingLeft: `${cssInsets.left}px`,
    }))
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0)
      return 1
    })

    installMpSafeAreaBridge()

    expect((fakeWindow as typeof fakeWindow & { __mpSafeArea: unknown }).__mpSafeArea).toEqual({
      top: 36,
      right: 12,
      bottom: 18,
      left: 10,
      vw: 390,
      vh: 844,
    })

    fakeWindow.innerWidth = 844
    fakeWindow.innerHeight = 390
    cssInsets = { top: 0, right: 20, bottom: 4, left: 18 }
    resizeListeners[0]()

    expect((fakeWindow as typeof fakeWindow & { __mpSafeArea: unknown }).__mpSafeArea).toEqual({
      top: 24,
      right: 20,
      bottom: 8,
      left: 18,
      vw: 844,
      vh: 390,
    })
  })
})
