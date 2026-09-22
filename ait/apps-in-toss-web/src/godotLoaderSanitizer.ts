export function neutralizeGeminiKeyFalsePositiveSource(source: string): string {
  return source.replaceAll('FAQ.html', 'FAQ_html')
}

// emscripten 런타임은 UA 에 Safari/ 가 있고 Version/x 가 잡히면 Safari 로 본다.
// Android WebView UA 는 "... Version/4.0 Chrome/152.0.0.0 Mobile Safari/537.36" 이라
// Safari 4.0 으로 오인되어 "requires Safari v15.2.0 (detected v040000)" 로 멈춘다.
//
// Chrome/ 이 있으면 Safari 분기를 타지 않게 해 실제 Safari 만 검사하게 한다.
// 공식 Web 템플릿에는 이 게이트가 있고 지금 쓰는 커스텀 템플릿에는 없다. 템플릿을
// 다시 만들거나 공식 템플릿으로 돌아가면 드러나므로 미리 막아 둔다.
const SAFARI_GATE = 'userAgent.includes("Safari/")&&userAgent.match('
const SAFARI_GATE_RELAXED =
  'userAgent.includes("Safari/")&&!userAgent.includes("Chrome/")&&userAgent.match('

export function relaxEmscriptenSafariGate(source: string): {
  source: string
  patched: boolean
} {
  if (!source.includes(SAFARI_GATE)) {
    return { source, patched: false }
  }
  return { source: source.replaceAll(SAFARI_GATE, SAFARI_GATE_RELAXED), patched: true }
}
