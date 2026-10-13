#!/usr/bin/env python3
"""Godot export가 생성한 InfoPlist.strings에 ATT 문구를 넣고 archive 포함을 검증한다."""
import argparse
import json
import plistlib
from pathlib import Path
import re
import subprocess

STRINGS = {
    "ko": "광고 효과를 측정하기 위해 다른 회사의 앱과 웹사이트에서의 활동과 연결할 수 있도록 허용을 요청합니다.",
    "en": "Allow linking your activity across other companies' apps and websites to measure advertising effectiveness.",
}
KEY = "NSUserTrackingUsageDescription"


def check_strings(path, locale):
    value = subprocess.check_output(["plutil", "-convert", "json", "-o", "-", str(path)], text=True)
    import json
    if json.loads(value).get(KEY) != STRINGS[locale]:
        raise RuntimeError(f"ATT 지역화가 다르다: {locale}")


def main():
    parser = argparse.ArgumentParser()
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--project", type=Path)
    group.add_argument("--archive", type=Path)
    args = parser.parse_args()
    if args.project:
        parent = args.project.parent
        pbx = args.project / "project.pbxproj"
        content = pbx.read_text()
        if "libmatch_ad_privacy" not in content or "AppTrackingTransparency.framework" not in content:
            raise RuntimeError("export 프로젝트의 native bridge/ATT framework 누락")
        sources = list(parent.rglob("*.cpp"))
        if not any("initialize_match_ad_privacy" in p.read_text() for p in sources):
            raise RuntimeError("native bridge 초기화 연결 누락")
        for locale, text in STRINGS.items():
            matches = list(parent.glob(f"*/{locale}.lproj/InfoPlist.strings"))
            if len(matches) != 1 or f"{locale}.lproj/InfoPlist.strings" not in content:
                raise RuntimeError(f"export 지역화 리소스 연결이 없다: {locale}")
            path = matches[0]
            original = path.read_text()
            original = re.sub(r'NSUserTrackingUsageDescription\s*=\s*"(?:[^"\\]|\\.)*"\s*;', "", original)
            path.write_text(original.rstrip() + f'\n{KEY} = "{text}";\n')
            check_strings(path, locale)
        print("[ios-privacy] export bridge/framework/ko·en 목적 문구 확인")
    else:
        apps = list((args.archive / "Products/Applications").glob("*.app"))
        if len(apps) != 1:
            raise RuntimeError("archive 앱을 하나로 확인할 수 없다")
        app = apps[0]
        info = plistlib.loads((app / "Info.plist").read_bytes())
        if info.get(KEY) != STRINGS["en"]:
            raise RuntimeError("signed 앱의 ATT 기본 목적 문구 누락")
        for locale in STRINGS:
            check_strings(app / f"{locale}.lproj/InfoPlist.strings", locale)
        binary = app / info["CFBundleExecutable"]
        linked = subprocess.check_output(["otool", "-L", str(binary)], text=True)
        if "AppTrackingTransparency.framework" not in linked:
            raise RuntimeError("signed 앱의 ATT framework 연결 누락")
        # release의 stripped symbol 여부에 의존하지 않고 등록 singleton/method 문자열을 검사한다.
        data = binary.read_bytes()
        for name in (b"MatchAdPrivacy", b"request_tracking_authorization", b"can_request_ads"):
            if name not in data:
                raise RuntimeError(f"signed 앱의 native bridge 누락: {name.decode()}")
        manifests = list(app.rglob("PrivacyInfo.xcprivacy"))
        if not manifests:
            raise RuntimeError("signed 앱의 SDK privacy manifest 누락")
        expected = json.loads((Path(__file__).resolve().parents[1] / "app-store/releases/1.1.7/sdk-privacy-manifests.json").read_text())
        declarations = [plistlib.loads(p.read_bytes()) for p in manifests]
        root_manifest = plistlib.loads((app / "PrivacyInfo.xcprivacy").read_bytes())
        if root_manifest.get("NSPrivacyTracking") is not True:
            raise RuntimeError("signed 앱의 root 추적 공개 누락")
        for sdk in expected["manifests"]:
            if sdk["declaration"] not in declarations:
                raise RuntimeError(f"signed 앱의 SDK 선언이 조사한 버전과 다르다: {sdk['sdk']}")
        print(f"[ios-privacy] signed 앱 bridge/ATT/ko·en/SDK manifest {len(manifests)}개 확인")


if __name__ == "__main__":
    main()
