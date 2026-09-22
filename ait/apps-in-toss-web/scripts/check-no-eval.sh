#!/usr/bin/env bash
set -euo pipefail

# 앱인토스 심사는 문자열을 코드로 실행하는 경로를 반려한다.
#
#   "eval과 같이 외부에서 코드를 받아와 실행 시킬 수 있는 코드는 보안 상 허용되지 않아요."
#
# Godot Web 내보내기에는 `JavaScriptBridge.eval()` 구현이 늘 들어 있다. 이 게임은
# 그 경로를 쓰지 않으므로(godot/autoload/platform.gd 는 get_interface 와
# create_callback 만 쓴다) sync-godot-web.mjs 가 본문을 비우고 이름까지 바꾼다.
# 여기서는 그 결과를 .ait 안에서 다시 확인한다.
#
# 검사는 토큰 단위다. 심사가 정적으로 훑으므로 실행 능력이 없는 `eval_ret` 같은
# 이름도 남기지 않는다.

package_path="${1:-match-picture-app.ait}"
if [[ ! -f "$package_path" ]]; then
  echo "AIT package not found: $package_path" >&2
  exit 1
fi

tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT

# AIT 헤더가 zip 앞에 붙어 있어 unzip 이 경고를 내면서도 정상 추출한다.
unzip -qq "$package_path" -d "$tmp_dir" 2>/dev/null || true

# wasm 과 pck 는 게임 바이너리라 제외한다. 검사 대상은 브라우저가 실행하는 JS 와
# HTML 이다.
#
# 부분문자열로 훑으면 안 된다. 앱인토스 SDK 자체가 `evaluate` 라는 이름을 쓰고
# emscripten 로더에는 `entryFunction(` 같은 평범한 호출이 있다. 둘 다 문자열을
# 코드로 실행하지 않는다. 그래서 실제 실행 형태만 잡는다.
#
#   eval(...)        직접 호출. `window.eval(` 도 잡히고 `evaluate:` 는 안 잡힌다
#   =eval / (eval)   별칭으로 빼돌리는 형태
#   new Function(    문자열로 함수를 만드는 형태
#   Function("...")  같은 것을 new 없이
pattern='[^A-Za-z0-9_$]eval\s*\(|[^A-Za-z0-9_$]eval\s*[,;)\]}=]|\bnew\s+Function\s*\(|[^A-Za-z0-9_$.]Function\s*\(\s*["'"'"'`]|\bimportScripts\s*\(|\bdocument\.write\s*\('

matches="$(rg -a -n --glob '*.js' --glob '*.mjs' --glob '*.html' -e "$pattern" "$tmp_dir" || true)"
if [[ -n "$matches" ]]; then
  echo "문자열 실행 경로로 읽힐 수 있는 토큰이 $package_path 에 남아 있습니다." >&2
  echo "→ sync-godot-web.mjs 의 disableJavaScriptBridgeEval 이 돌지 않았거나," >&2
  echo "   Godot 버전이 바뀌어 패턴이 달라졌을 수 있습니다." >&2
  echo "$matches" | sed "s#^$tmp_dir/##" | cut -c1-200 >&2
  exit 1
fi

echo "AIT package contains no dynamic code execution token."
