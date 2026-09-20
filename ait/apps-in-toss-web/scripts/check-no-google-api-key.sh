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
pattern='AIza[0-9A-Za-z_-]{20,}|AQ\.[A-Za-z0-9_-]{30,}|generativelanguage\.googleapis\.com|@firebase/ai|gemini-[0-9]|api[_-]?secret|VITE_GA4_MP_API_SECRET'
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
