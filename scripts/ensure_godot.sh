#!/usr/bin/env bash
set -euo pipefail

with_export_templates=0

usage() {
  cat <<'USAGE'
Usage:
  ensure_godot.sh [--with-export-templates]

Environment:
  GODOT_VERSION defaults to 4.7.2
  GODOT_STATUS defaults to stable
USAGE
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --with-export-templates)
      with_export_templates=1
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

godot_version="${GODOT_VERSION:-4.7.2}"
godot_status="${GODOT_STATUS:-stable}"

ensure_linux_godot() {
  if command -v godot >/dev/null 2>&1 && godot --version | grep -q "^${godot_version}.${godot_status}"; then
    echo "Using preinstalled Godot: $(command -v godot)"
    godot --version
    return
  fi

  machine="$(uname -m)"
  case "${machine}" in
    aarch64|arm64)
      godot_arch="arm64"
      ;;
    x86_64|amd64)
      godot_arch="x86_64"
      ;;
    *)
      echo "Unsupported runner architecture: ${machine}" >&2
      exit 1
      ;;
  esac

  install_dir="${RUNNER_TEMP:-/tmp}/godot"
  archive="${install_dir}/godot.zip"
  url="https://github.com/godotengine/godot/releases/download/${godot_version}-${godot_status}/Godot_v${godot_version}-${godot_status}_linux.${godot_arch}.zip"

  mkdir -p "${install_dir}" "${HOME}/.local/bin"
  curl -fsSL "${url}" -o "${archive}"
  unzip -q "${archive}" -d "${install_dir}"

  binary="$(find "${install_dir}" -maxdepth 2 -type f -name "Godot_*_linux.${godot_arch}" -print -quit)"
  if [ -z "${binary}" ]; then
    echo "Godot linux.${godot_arch} binary not found in ${archive}" >&2
    exit 1
  fi

  chmod +x "${binary}"
  ln -sf "${binary}" "${HOME}/.local/bin/godot"
  export PATH="${HOME}/.local/bin:${PATH}"
  if [ -n "${GITHUB_PATH:-}" ]; then
    echo "${HOME}/.local/bin" >> "${GITHUB_PATH}"
  fi
  godot --version
}

template_base_dir() {
  case "$(uname -s)" in
    Darwin)
      printf '%s\n' "${HOME}/Library/Application Support/Godot/export_templates"
      ;;
    *)
      printf '%s\n' "${XDG_DATA_HOME:-${HOME}/.local/share}/godot/export_templates"
      ;;
  esac
}

ensure_export_templates() {
  template_dir="$(template_base_dir)/${godot_version}.${godot_status}"

  if [ -d "${template_dir}" ] && [ -n "$(find "${template_dir}" -mindepth 1 -maxdepth 1 -print -quit)" ]; then
    echo "Using Godot export templates: ${template_dir}"
    return
  fi

  tmp_dir="${RUNNER_TEMP:-/tmp}/godot-export-templates"
  archive="${tmp_dir}/export_templates.tpz"
  url="https://github.com/godotengine/godot/releases/download/${godot_version}-${godot_status}/Godot_v${godot_version}-${godot_status}_export_templates.tpz"

  mkdir -p "${tmp_dir}" "${template_dir}"
  curl -fsSL "${url}" -o "${archive}"
  unzip -q "${archive}" -d "${tmp_dir}"

  if [ ! -d "${tmp_dir}/templates" ]; then
    echo "Expected templates directory not found in ${archive}" >&2
    exit 1
  fi

  cp -R "${tmp_dir}/templates/." "${template_dir}/"
  echo "Installed Godot export templates: ${template_dir}"
}

case "$(uname -s)" in
  Linux)
    ensure_linux_godot
    ;;
  Darwin)
    if ! command -v godot >/dev/null 2>&1; then
      echo "Godot is not installed or not on PATH." >&2
      exit 1
    fi
    godot --version
    ;;
  *)
    echo "Unsupported OS: $(uname -s)" >&2
    exit 1
    ;;
esac

if [ "${with_export_templates}" -eq 1 ]; then
  ensure_export_templates
fi

