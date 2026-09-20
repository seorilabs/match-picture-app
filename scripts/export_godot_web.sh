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

set +e
godot --headless --path "${project_dir}" --export-release "${preset}" "${index_path}" 2>&1 | tee "${log_file}"
status="${PIPESTATUS[0]}"
set -e

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

