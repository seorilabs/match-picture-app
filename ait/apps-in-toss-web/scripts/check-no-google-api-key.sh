#!/usr/bin/env bash
set -euo pipefail

package_path="${1:-match-picture-app.ait}"
if [[ ! -f "$package_path" ]]; then
  echo "AIT package not found: $package_path" >&2
  exit 1
fi

tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT

# The AIT header adds bytes before the embedded zip, so unzip can warn while
# still extracting successfully.
unzip -qq "$package_path" -d "$tmp_dir" 2>/dev/null || true

# 실제 키/시크릿 마커. 신형 Gemini API Key(`AQ.<base64>`)도 포함한다.
# GA4 Measurement Protocol 의 api_secret 은 여기서 잡지 않는다. 이 게임은 세 표면이
# 같은 코드로 같은 이벤트를 보내기 위해 그 경로를 의도적으로 쓰고, 값은 릴리스에서
# 중앙 워크플로가 analytics.config.json 으로 주입한다(godot/analytics.config.json).
# 막으려는 것은 Gemini/Google API Key 가 실수로 섞여 들어가는 것과, 앱인토스 정적
# 분석이 로더의 FAQ.html 을 신형 Gemini Key 로 오탐하는 것이다.
pattern='AIza[0-9A-Za-z_-]{20,}|AQ\.[A-Za-z0-9_-]{30,}|generativelanguage\.googleapis\.com|@firebase/ai|gemini-[0-9]'
if rg -a -l -e "$pattern" "$tmp_dir" >/dev/null; then
  echo "Forbidden Google/Gemini API marker found in $package_path" >&2
  rg -a -l -e "$pattern" "$tmp_dir" | sed "s#^$tmp_dir/##" >&2
  exit 1
fi

# 오탐 방지 sentinel: Godot/emscripten 로더의 `AQ.html`(FAQ.html)이 남아 있으면
# AppsInToss 정적 분석이 이를 Gemini API Key로 오인해 반려한다. sync-godot-web.mjs의
# neutralizeGeminiKeyFalsePositive가 반드시 `FAQ_html`로 치환했어야 한다.
if rg -a -l -e 'AQ\.html' "$tmp_dir" >/dev/null; then
  echo "Gemini-key false-positive trigger 'AQ.html' still present in $package_path" >&2
  echo "→ sync-godot-web.mjs 의 Gemini 오탐 무력화가 실행되지 않았습니다." >&2
  rg -a -l -e 'AQ\.html' "$tmp_dir" | sed "s#^$tmp_dir/##" >&2
  exit 1
fi

echo "AIT package contains no Google/Gemini API key marker."
