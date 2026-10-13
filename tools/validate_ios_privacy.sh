#!/usr/bin/env bash
set -euo pipefail
python3 "$(dirname "$0")/finish_ios_privacy.py" --archive "${ARCHIVE_PATH:?ARCHIVE_PATH is required}"
