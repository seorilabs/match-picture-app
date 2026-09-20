#!/usr/bin/env python3
"""Google Play Data safety 공시가 실제 코드의 수집 상태와 어긋나지 않는지 검사한다.

Play 공개 listing 이 "No data collected" 인데 앱은 이벤트를 보내는 불일치, 그리고 그 반대
(계측을 걷어냈는데 공시는 여전히 수집을 주장하는 것) 둘 다 막는다. 코드와 공시를 같은
커밋에서 함께 바꾸게 만드는 것이 목적이다.

실행: python3 tools/check_data_safety.py
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "ops/google-play-data-safety.json"

# 계측과 광고 어댑터가 사는 자리. 테스트는 보지 않는다.
SOURCE_ROOTS = ("godot/src", "godot/autoload", "ait")
SOURCE_SUFFIXES = (".gd", ".ts", ".tsx")

ANALYTICS_PATTERN = re.compile(r"\blog_event\s*\(|\blogEvent\s*\(|MpAnalyticsPort")
ADS_PATTERN = re.compile(r"MpInterstitialAdPort|showFullScreenAd|loadFullScreenAd")

REQUIRED_WHEN_COLLECTING = "App activity/App interactions"
REQUIRED_WHEN_SDK = "Device or other IDs/Device or other IDs"

problems: list[str] = []


def fail(message: str) -> None:
    problems.append(message)


def source_files() -> list[Path]:
    files: list[Path] = []
    for root in SOURCE_ROOTS:
        base = ROOT / root
        if not base.is_dir():
            continue
        for path in base.rglob("*"):
            if not path.is_file() or path.suffix not in SOURCE_SUFFIXES:
                continue
            if "tests" in path.parts or path.name.endswith(".test.ts"):
                continue
            files.append(path)
    return files


def main() -> int:
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))

    sources = source_files()
    if not sources:
        print(f"[data-safety] 검사할 소스가 없다: {SOURCE_ROOTS}", file=sys.stderr)
        return 2

    analytics = False
    ads = False
    for path in sources:
        text = path.read_text(encoding="utf-8")
        analytics = analytics or bool(ANALYTICS_PATTERN.search(text))
        ads = ads or bool(ADS_PATTERN.search(text))

    declared = [
        f"{item.get('category')}/{item.get('type')}"
        for item in manifest.get("collection", [])
        if item.get("collected") is True
    ]

    if analytics and manifest.get("no_data_collected") is not False:
        fail("계측이 살아 있는데 공시가 'no data collected' 로 남아 있다.")
    if analytics and not declared:
        fail("수집 중인데 공시에 collected=true 항목이 하나도 없다.")
    if analytics and REQUIRED_WHEN_COLLECTING not in declared:
        fail(f"이벤트 수집은 '{REQUIRED_WHEN_COLLECTING}' 로 공시해야 한다.")
    if (analytics or ads) and REQUIRED_WHEN_SDK not in declared:
        fail(f"Firebase/광고 SDK 는 기기 식별자를 쓰므로 '{REQUIRED_WHEN_SDK}' 공시가 필요하다.")
    if not analytics and declared:
        fail("계측이 없는데 공시는 수집을 주장한다. 둘 중 하나가 오래된 상태다.")
    if not analytics and manifest.get("no_data_collected") is not True:
        fail("계측이 없으면 공시의 no_data_collected 는 true 여야 한다.")

    # 공시가 가리키는 근거 경로가 실제로 있는지 본다. 파일을 옮기고 공시를 두고 오는 일이 잦다.
    for item in manifest.get("collection", []):
        evidence = str(item.get("evidence", ""))
        for candidate in re.findall(r"[\w./-]+\.(?:gd|ts|tsx|json)", evidence):
            if not (ROOT / candidate).exists():
                fail(f"공시의 근거 경로가 없다: {candidate} ({item.get('category')}/{item.get('type')})")

    if problems:
        for problem in problems:
            print(f"[data-safety] {problem}", file=sys.stderr)
        print(
            "[data-safety] ops/google-play-data-safety.json 과 Play Console Data safety 를 함께 갱신하세요.",
            file=sys.stderr,
        )
        return 1

    print(f"[data-safety] OK — analytics={analytics}, ads={ads}, declared={len(declared)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
