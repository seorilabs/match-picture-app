#!/usr/bin/env bash
set -euo pipefail

project="."
smoke_scenes=()
godot_bin="${GODOT_BIN:-godot}"
log_dir="${GODOT_QUALITY_GATE_LOG_DIR:-}"
run_import=1

usage() {
  cat <<'USAGE'
Usage:
  godot_quality_gate.sh [--project PATH] [--smoke-scene RES://SCENE_OR_SCRIPT]... [--godot-bin PATH] [--skip-import]

  --smoke-scene 은 여러 번 줄 수 있다. 준 순서대로 돌리고 하나라도 실패하면 멈춘다.

Checks:
  1. Runs: godot --headless --path <project> --import --quit
  2. Runs: godot --headless --path <project> --quit
  3. Fails when Godot exits non-zero
  4. Fails when Godot logs lines beginning with SCRIPT ERROR or ERROR:
  5. Optionally runs each smoke scene or .gd script with the same log rules
USAGE
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --project)
      project="${2:?missing value for --project}"
      shift 2
      ;;
    --smoke-scene)
      smoke_scenes+=("${2:?missing value for --smoke-scene}")
      shift 2
      ;;
    --godot-bin)
      godot_bin="${2:?missing value for --godot-bin}"
      shift 2
      ;;
    --skip-import)
      run_import=0
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if [ -z "${log_dir}" ]; then
  log_dir="$(mktemp -d)"
else
  mkdir -p "${log_dir}"
fi

run_godot_check() {
  local label="$1"
  shift
  local log_file="${log_dir}/${label}.log"

  echo "[godot-quality] running ${label}: $*" >&2
  local limit="${GODOT_COMMAND_TIMEOUT_SECONDS:-300}"
  set +e
  # 명령마다 상한을 건다. GDScript 파스 에러가 나면 headless Godot 이 종료하지 않고
  # 세션을 붙잡은 채 남는다. macOS 기본 환경에는 timeout 이 없어 perl 까지 폴백한다.
  if command -v timeout >/dev/null 2>&1; then
    timeout --kill-after=10s "${limit}s" "$@" 2>&1 | tee "${log_file}"
  elif command -v gtimeout >/dev/null 2>&1; then
    gtimeout --kill-after=10s "${limit}s" "$@" 2>&1 | tee "${log_file}"
  else
    perl -e 'alarm shift; exec @ARGV' "${limit}" "$@" 2>&1 | tee "${log_file}"
  fi
  local status="${PIPESTATUS[0]}"
  set -e

  if [ "${status}" -eq 124 ] || [ "${status}" -eq 137 ] || [ "${status}" -eq 142 ]; then
    echo "[godot-quality] ${label} 가 ${limit}초 안에 끝나지 않아 강제 종료됐다. Log: ${log_file}" >&2
    exit 1
  fi

  if [ "${status}" -ne 0 ]; then
    echo "[godot-quality] ${label} failed with exit ${status}. Log: ${log_file}" >&2
    exit "${status}"
  fi

  if grep -E "^(SCRIPT ERROR|ERROR):" "${log_file}" >/dev/null; then
    echo "[godot-quality] ${label} reported Godot errors. Log: ${log_file}" >&2
    grep -E "^(SCRIPT ERROR|ERROR):" "${log_file}" >&2 || true
    exit 1
  fi

  echo "[godot-quality] ${label} passed. Log: ${log_file}" >&2
}

if [ "${run_import}" -eq 1 ]; then
  run_godot_check "import" "${godot_bin}" --headless --path "${project}" --import --quit
fi

run_godot_check "compile" "${godot_bin}" --headless --path "${project}" --quit

# compile 단계는 tests/ 를 파스하지 않는다. 테스트 스크립트의 파스 에러는
# 여기서 실제로 돌려 봐야 잡힌다. 실제로 그렇게 놓친 적이 있다.
for smoke_scene in ${smoke_scenes[@]+"${smoke_scenes[@]}"}; do
  label="smoke-$(basename "${smoke_scene}" | sed 's/\.[^.]*$//')"
  case "${smoke_scene}" in
    *.gd)
      run_godot_check "${label}" "${godot_bin}" --headless --path "${project}" --script "${smoke_scene}"
      ;;
    *)
      run_godot_check "${label}" "${godot_bin}" --headless --path "${project}" "${smoke_scene}"
      ;;
  esac
done
