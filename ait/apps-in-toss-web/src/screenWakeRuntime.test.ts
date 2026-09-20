import { afterEach, describe, expect, it, vi } from 'vitest'

import { installMpScreenWakeBridge } from './screenWakeRuntime.ts'

describe('installMpScreenWakeBridge', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('acquires while visible and re-acquires after the OS releases the lock', async () => {
    const visibilityListeners: Array<() => void> = []
    const releaseListeners: Array<() => void> = []
    const fakeDocument = {
      visibilityState: 'visible',
      addEventListener: vi.fn((type: string, listener: () => void) => {
        if (type === 'visibilitychange') {
          visibilityListeners.push(listener)
        }
      }),
    }
    const request = vi.fn(async () => ({
      released: false,
      release: vi.fn(async () => undefined),
      addEventListener: vi.fn((type: string, listener: () => void) => {
        if (type === 'release') {
          releaseListeners.push(listener)
        }
      }),
    }))

    vi.stubGlobal('document', fakeDocument)
    vi.stubGlobal('navigator', { wakeLock: { request } })

    installMpScreenWakeBridge()
    await vi.waitFor(() => expect(request).toHaveBeenCalledTimes(1))

    fakeDocument.visibilityState = 'hidden'
    visibilityListeners[0]()
    expect(request).toHaveBeenCalledTimes(1)

    releaseListeners[0]()
    fakeDocument.visibilityState = 'visible'
    visibilityListeners[0]()
    await vi.waitFor(() => expect(request).toHaveBeenCalledTimes(2))
    expect(request).toHaveBeenLastCalledWith('screen')
  })
})
