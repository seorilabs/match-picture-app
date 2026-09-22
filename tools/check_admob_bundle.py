#!/usr/bin/env python3
"""vendoring 한 AdMob 플러그인이 온전한지, 설정이 어긋나지 않았는지 검사한다.

플러그인은 바이너리까지 저장소에 넣어 두었다. 파일이 빠지거나 버전이 어긋나면
빌드가 아니라 실기기에서 광고가 안 나오는 식으로 늦게 드러나므로 여기서 막는다.

실행: python3 tools/check_admob_bundle.py
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# merge-battle 과 같은 버전이다. Godot 4.7.2 까지 테스트된 릴리스다.
# v4 는 "v5.1.0" 처럼 접두사가 붙었지만 v5 부터는 숫자만 쓴다.
PLUGIN_VERSION = "5.1.0"

# 없으면 광고가 아예 초기화되지 않는 네이티브 payload.
REQUIRED_PAYLOADS = [
    "godot/addons/admob/android/bin/ads/libs/poing-godot-admob-ads-debug.aar",
    "godot/addons/admob/android/bin/ads/libs/poing-godot-admob-ads-release.aar",
    "godot/addons/admob/android/bin/ads/libs/poing-godot-admob-core-debug.aar",
    "godot/addons/admob/android/bin/ads/libs/poing-godot-admob-core-release.aar",
    "godot/addons/admob/ios/bin/ads/libs/poing-godot-admob-ads.debug.xcframework/Info.plist",
    "godot/addons/admob/ios/bin/ads/libs/poing-godot-admob-ads.release.xcframework/Info.plist",
]

# Google 이 문서에 쓰는 테스트 ID. 이 값이 남아 있으면 수익이 0 이 된다.
TEST_ID_PREFIX = "ca-app-pub-3940256099942544"

# 자격증명 카탈로그 app/match-picture-app/admob/public-identifiers 와 같아야 한다.
EXPECTED = {
    "godot/project.godot": [
        'general/android/app_id="ca-app-pub-9932778305312246~8514815775"',
        'general/ios/app_id="ca-app-pub-9932778305312246~3239589743"',
    ],
    "godot/src/platform/admob_interstitial_ads.gd": [
        'ANDROID_AD_UNIT_ID := "ca-app-pub-9932778305312246/8323244087"',
        'IOS_AD_UNIT_ID := "ca-app-pub-9932778305312246/8756953389"',
    ],
}

# Web(.ait) 번들에 7MB 짜리 iOS 바이너리가 실려 나가는 것을 막는다.
WEB_EXCLUDES = ["addons/admob/android/**", "addons/admob/ios/**"]


def fail(problems: list[str]) -> int:
    for problem in problems:
        print(f"[admob] {problem}", file=sys.stderr)
    return 1


def main() -> int:
    problems: list[str] = []

    plugin_cfg = ROOT / "godot/addons/admob/plugin.cfg"
    if not plugin_cfg.is_file():
        return fail([f"플러그인이 없다: {plugin_cfg}"])
    if f'version="{PLUGIN_VERSION}"' not in plugin_cfg.read_text(encoding="utf-8"):
        problems.append(f"플러그인 버전이 {PLUGIN_VERSION} 이 아니다: {plugin_cfg}")

    for relative in REQUIRED_PAYLOADS:
        path = ROOT / relative
        if not path.is_file() or path.stat().st_size <= 512:
            problems.append(f"네이티브 payload 가 비었거나 없다: {relative}")

    for relative, needles in EXPECTED.items():
        text = (ROOT / relative).read_text(encoding="utf-8")
        for needle in needles:
            if needle not in text:
                problems.append(f"{relative} 에 기대한 식별자가 없다: {needle}")
        if TEST_ID_PREFIX in text:
            problems.append(f"{relative} 에 Google 테스트 광고 ID 가 남아 있다")

    presets = (ROOT / "godot/export_presets.cfg").read_text(encoding="utf-8")
    web_filter = re.search(r'name="Web".*?exclude_filter="([^"]*)"', presets, re.S)
    if web_filter is None:
        problems.append("Web preset 의 exclude_filter 를 찾지 못했다")
    else:
        for needle in WEB_EXCLUDES:
            if needle not in web_filter.group(1):
                problems.append(f"Web export 가 네이티브 바이너리를 빼지 않는다: {needle}")

    if problems:
        return fail(problems)
    print(f"[admob] OK — Poing {PLUGIN_VERSION}, payload {len(REQUIRED_PAYLOADS)}개, 식별자 일치")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
