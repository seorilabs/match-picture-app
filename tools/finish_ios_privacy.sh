#!/usr/bin/env bash
set -euo pipefail
python3 "$(dirname "$0")/finish_ios_privacy.py" --project "${XCODE_PROJECT:?XCODE_PROJECT is required}"
