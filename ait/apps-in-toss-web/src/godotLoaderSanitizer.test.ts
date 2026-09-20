import { describe, expect, it } from 'vitest'

import { neutralizeGeminiKeyFalsePositiveSource } from './godotLoaderSanitizer.ts'

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
