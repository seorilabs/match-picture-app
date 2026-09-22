import { describe, expect, it } from 'vitest'

import {
  neutralizeGeminiKeyFalsePositiveSource,
  relaxEmscriptenSafariGate,
} from './godotLoaderSanitizer.ts'

describe('neutralizeGeminiKeyFalsePositiveSource', () => {
  it('removes every FAQ.html sequence that can trigger the AQ key scanner', () => {
    const loaderSource = [
      'See https://emscripten.org/docs/porting/Debugging.html#FAQ.html#abort',
      'fallback=/FAQ.html#missing-feature',
    ].join('\n')

    const sanitized = neutralizeGeminiKeyFalsePositiveSource(loaderSource)

    expect(sanitized).not.toContain('AQ.html')
    expect(sanitized).not.toContain('FAQ.html')
    expect(sanitized).toContain('FAQ_html#abort')
    expect(sanitized).toContain('FAQ_html#missing-feature')
  })
})

describe('relaxEmscriptenSafariGate', () => {
  // 빌드 산출물이 아니라 fixture 로 검증한다. 산출물은 템플릿에 따라 게이트가
  // 있기도 없기도 해서, 그것에 기대면 검사가 조용히 무의미해진다.
  const loaderSource =
    'var currentSafariVersion=userAgent.includes("Safari/")&&userAgent.match(' +
    '/Version\\/(\\d+)/)?humanReadable:0;if(currentSafariVersion<150200){throw new Error("nope")}'

  it('Android WebView 처럼 Chrome/ 이 있는 UA 는 Safari 분기를 타지 않는다', () => {
    const { source, patched } = relaxEmscriptenSafariGate(loaderSource)

    expect(patched).toBe(true)
    expect(source).toContain('!userAgent.includes("Chrome/")')
  })

  it('게이트가 없는 로더는 그대로 둔다', () => {
    const { source, patched } = relaxEmscriptenSafariGate('var a=1')

    expect(patched).toBe(false)
    expect(source).toBe('var a=1')
  })
})
