#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="${1:-godot}"
GODOT_BIN="${GODOT_BIN:-godot}"

RAW_VERSION="$("${GODOT_BIN}" --headless --version)"
TEMPLATE_VERSION="$(printf "%s" "${RAW_VERSION}" | sed -E 's/\.(official|custom_build)\..*$//')"
case "$(uname -s)" in
  Darwin) TEMPLATE_BASE="${HOME}/Library/Application Support/Godot/export_templates" ;;
  *)      TEMPLATE_BASE="${XDG_DATA_HOME:-${HOME}/.local/share}/godot/export_templates" ;;
esac
TEMPLATE_ZIP="${TEMPLATE_BASE}/${TEMPLATE_VERSION}/android_source.zip"

if [ ! -f "${TEMPLATE_ZIP}" ]; then
  echo "Missing Android source template: ${TEMPLATE_ZIP}" >&2
  exit 1
fi

mkdir -p "${PROJECT_DIR}/android"
rm -rf "${PROJECT_DIR}/android/build"
mkdir -p "${PROJECT_DIR}/android/build"
unzip -q "${TEMPLATE_ZIP}" -d "${PROJECT_DIR}/android/build"
printf "%s\n" "${TEMPLATE_VERSION}" > "${PROJECT_DIR}/android/.build_version"
: > "${PROJECT_DIR}/android/build/.gdignore"

BUILD_GRADLE="${PROJECT_DIR}/android/build/build.gradle"
CONFIG_GRADLE="${PROJECT_DIR}/android/build/config.gradle"
if ! grep -Fq "com.google.gms:google-services" "${BUILD_GRADLE}"; then
  tmp_file="$(mktemp)"
  {
    cat <<'GRADLE'
buildscript {
    dependencies {
        classpath 'com.google.gms:google-services:4.4.4'
    }
}

GRADLE
    cat "${BUILD_GRADLE}"
  } > "${tmp_file}"
  mv "${tmp_file}" "${BUILD_GRADLE}"
fi

if ! grep -Fq "getReleaseKeyPassword" "${CONFIG_GRADLE}"; then
  python3 - "${CONFIG_GRADLE}" <<'PY'
import sys
from pathlib import Path

path = Path(sys.argv[1])
text = path.read_text(encoding="utf-8")
old = '''ext.getReleaseKeyAlias = { ->
    String keyAlias = project.hasProperty("release_keystore_alias") ? project.property("release_keystore_alias") : ""
    return keyAlias
}

ext.isAndroidStudio = { ->
'''
new = '''ext.getReleaseKeyAlias = { ->
    String keyAlias = project.hasProperty("release_keystore_alias") ? project.property("release_keystore_alias") : ""
    return keyAlias
}

ext.getReleaseKeyPassword = { ->
    String keyPassword = project.hasProperty("release_keystore_key_password") ? project.property("release_keystore_key_password") : ""
    if (keyPassword == null || keyPassword.isEmpty()) {
        keyPassword = System.getenv("GODOT_ANDROID_KEYSTORE_RELEASE_KEY_PASSWORD")
    }
    if (keyPassword == null || keyPassword.isEmpty()) {
        keyPassword = getReleaseKeystorePassword()
    }
    return keyPassword
}

ext.isAndroidStudio = { ->
'''
if old not in text:
    raise SystemExit(f"Could not patch release key password helper in {path}")
path.write_text(text.replace(old, new), encoding="utf-8")
PY
fi

python3 - "${BUILD_GRADLE}" <<'PY'
import sys
from pathlib import Path

path = Path(sys.argv[1])
text = path.read_text(encoding="utf-8")
old = "                keyPassword getReleaseKeystorePassword()\n"
new = "                keyPassword getReleaseKeyPassword()\n"
if new not in text:
    if old not in text:
        raise SystemExit(f"Could not patch release key password use in {path}")
    path.write_text(text.replace(old, new, 1), encoding="utf-8")
PY

if ! grep -Fq "com.google.gms.google-services" "${BUILD_GRADLE}"; then
  cat <<'GRADLE' >> "${BUILD_GRADLE}"

if (file('google-services.json').exists()) {
    apply plugin: 'com.google.gms.google-services'
} else {
    logger.lifecycle('Skipping Google Services plugin because google-services.json is missing')
}
GRADLE
fi

echo "Installed Android build template ${TEMPLATE_VERSION} into ${PROJECT_DIR}/android/build"
