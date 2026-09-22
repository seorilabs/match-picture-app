import { describe, expect, it } from 'vitest'

import {
  disableJavaScriptBridgeEval,
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

describe('disableJavaScriptBridgeEval', () => {
  // 실제 로더에서 잘라 온 형태. 미니파이돼 한 줄이다.
  const loader =
    'function _godot_js_eval(p_js,p_use_global_ctx,p_union_ptr,p_byte_arr,p_byte_arr_write,p_callback)' +
    '{const js_code=GodotRuntime.parseString(p_js);' +
    'let eval_ret=null;try{if(p_use_global_ctx){const global_eval=eval;' +
    'eval_ret=global_eval(js_code)}else{eval_ret=eval(js_code)}}catch(e){GodotRuntime.error(e)}' +
    'switch(typeof eval_ret){case"boolean":return 1}}' +
    'var wasmImports={ce:_godot_js_emscripten_get_version,je:_godot_js_eval,tb:_godot_js_fetch_create};'

  it('문자열 실행 경로를 지운다', () => {
    const { source, patched } = disableJavaScriptBridgeEval(loader)
    expect(patched).toBe(true)
    expect(source).not.toContain('eval')
  })

  it('wasm import 키를 그대로 둔다', () => {
    // 이 키가 바뀌면 wasm 이 함수를 못 찾아 캔버스가 검게 나온다. 예전에 이 패치를
    // 껐던 이유가 그것이다.
    const { source } = disableJavaScriptBridgeEval(loader)
    expect(source).toContain('je:_godot_js_blocked_code_execution')
    expect(source).toContain('ce:_godot_js_emscripten_get_version')
  })

  it('패턴이 없으면 건드리지 않는다', () => {
    const { source, patched } = disableJavaScriptBridgeEval('function noop(){}')
    expect(patched).toBe(false)
    expect(source).toBe('function noop(){}')
  })
})
