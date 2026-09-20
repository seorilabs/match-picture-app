#!/usr/bin/env bash
set -euo pipefail

project_dir="${GODOT_PROJECT_DIR:-godot}"
preset="${GODOT_WEB_PRESET:-Web}"
output_dir="${GODOT_WEB_OUTPUT_DIR:-build/web}"
log_dir="${GODOT_WEB_LOG_DIR:-build/logs}"

mkdir -p "${output_dir}" "${log_dir}"

output_dir_abs="$(cd "${output_dir}" && pwd)"
index_path="${output_dir_abs}/index.html"
log_file="${log_dir}/godot-web-export.log"

echo "[godot-web] exporting ${preset} to ${index_path}" >&2

limit="${GODOT_COMMAND_TIMEOUT_SECONDS:-900}"
set +e
# 파스 에러가 나면 headless Godot 이 종료하지 않고 남는다. 명령마다 상한을 건다.
if command -v timeout >/dev/null 2>&1; then
  timeout --kill-after=10s "${limit}s" godot --headless --path "${project_dir}" --export-release "${preset}" "${index_path}" 2>&1 | tee "${log_file}"
else
  perl -e 'alarm shift; exec @ARGV' "${limit}" godot --headless --path "${project_dir}" --export-release "${preset}" "${index_path}" 2>&1 | tee "${log_file}"
fi
status="${PIPESTATUS[0]}"
set -e

if [ "${status}" -eq 124 ] || [ "${status}" -eq 137 ] || [ "${status}" -eq 142 ]; then
  echo "[godot-web] export 가 ${limit}초 안에 끝나지 않아 강제 종료됐다. Log: ${log_file}" >&2
  exit 1
fi

if [ "${status}" -ne 0 ]; then
  echo "[godot-web] export failed with exit ${status}. Log: ${log_file}" >&2
  exit "${status}"
fi

if grep -E "^(SCRIPT ERROR|ERROR):" "${log_file}" >/dev/null; then
  echo "[godot-web] Godot reported errors during web export. Log: ${log_file}" >&2
  grep -E "^(SCRIPT ERROR|ERROR):" "${log_file}" >&2 || true
  exit 1
fi

required_files=(
  "${output_dir_abs}/index.html"
  "${output_dir_abs}/index.js"
  "${output_dir_abs}/index.wasm"
  "${output_dir_abs}/index.pck"
)

for file in "${required_files[@]}"; do
  if [ ! -f "${file}" ]; then
    echo "[godot-web] missing expected export file: ${file}" >&2
    exit 1
  fi
done

touch "${output_dir_abs}/.nojekyll"
echo "[godot-web] export complete: ${output_dir_abs}" >&2

