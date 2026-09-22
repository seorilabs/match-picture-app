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

// Godot 의 `JavaScriptBridge.eval()` 구현을 걷어낸다.
//
// 앱인토스 심사가 이것을 반려했다. "eval과 같이 외부에서 코드를 받아와 실행 시킬 수
// 있는 코드는 보안 상 허용되지 않아요." 이 게임은 `JavaScriptBridge` 를 쓰긴 하지만
// `get_interface` 와 `create_callback` 만 쓴다(autoload/platform.gd). 문자열을 코드로
// 실행하는 경로는 한 번도 부르지 않는다.
//
// 함수를 지우면 안 된다. wasm 이 이 함수를 import 하기 때문이다. 다만 **import 이름이
// 미니파이돼 있다.** 로더의 매핑은 `je:_godot_js_eval` 이고 wasm 쪽에 남은 이름은
// `je` 뿐이다. 그래서 `je:` 키만 그대로 두면 JS 함수 이름과 본문은 마음대로 바꿔도
// 연결이 끊기지 않는다. 전에 이 패치를 껐던 이유가 여기에 있었다. wasm 에서
// `godot_js_eval` 문자열을 찾으니 0건이라 짝이 없다고 보고 함수를 통째로 지웠고,
// 그래서 `_godot_js_eval is not defined` 로 캔버스가 검게 나왔다.
//
// 이름까지 바꾸는 이유는 `_godot_js_eval(` 안에 `eval(` 이 그대로 들어 있어서다.
// 토큰으로 훑는 검사에 그대로 걸린다.
const EVAL_BODY =
  'let eval_ret=null;try{if(p_use_global_ctx){const global_eval=eval;' +
  'eval_ret=global_eval(js_code)}else{eval_ret=eval(js_code)}}catch(e){GodotRuntime.error(e)}'
const EVAL_BODY_DISABLED =
  'let eval_ret=null;GodotRuntime.error("JavaScriptBridge code execution is disabled in this build.");'

const EVAL_FUNCTION_NAME = '_godot_js_eval'
const EVAL_FUNCTION_NAME_DISABLED = '_godot_js_blocked_code_execution'

// 남는 지역 변수 이름까지 바꿔 로더에 `eval` 이라는 글자 자체를 남기지 않는다.
// 실행 능력은 위에서 이미 사라지지만, 심사는 토큰으로도 훑는다.
const EVAL_LOCAL = 'eval_ret'
const EVAL_LOCAL_RENAMED = 'bridge_ret'

export function disableJavaScriptBridgeEval(source: string): {
  source: string
  patched: boolean
} {
  if (!source.includes(EVAL_BODY)) {
    return { source, patched: false }
  }
  // 본문을 먼저 비우고, 그 다음에 이름을 바꾼다. 순서가 바뀌면 위 본문 문자열이
  // 더 이상 맞지 않는다.
  const withoutEval = source
    .replace(EVAL_BODY, EVAL_BODY_DISABLED)
    .replaceAll(EVAL_FUNCTION_NAME, EVAL_FUNCTION_NAME_DISABLED)
    .replaceAll(EVAL_LOCAL, EVAL_LOCAL_RENAMED)
  return { source: withoutEval, patched: true }
}
