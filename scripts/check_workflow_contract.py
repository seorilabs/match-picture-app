#!/usr/bin/env python3
"""org 재사용 워크플로우 caller 계약을 기계적으로 검사한다.

계약(seorilabs/.github):
- 모든 `uses:`는 immutable commit SHA로 고정한다. floating ref는 release binding의
  config revision을 고정할 수 없다.
- org 정본 호출은 승인된 authority commit 하나만 쓴다.
- caller는 secret을 상속하지 않는다. called workflow가 선언한 이름만 1:1로 전달한다.
- caller가 부여하는 권한은 called workflow가 선언한 권한보다 낮지 않아야 한다.
- Apple archive/upload는 Xcode Cloud가 표준 실행 환경이다. GitHub Actions macOS 러너로
  우회하지 않는다.

의존성 없이 python3만으로 동작한다.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

AUTHORITY_SHA = "9afa357f9ba6c8d6a813c7cec7ad3d35c626bdd5"
SHA_PATTERN = re.compile(r"^[0-9a-f]{40}$")

# 정본 commit의 workflow_call 선언. caller는 이 집합을 그대로 만족해야 한다.
CENTRAL_CONTRACT = {
    "godot-deploy-ait": {
        "permissions": {"contents": "read"},
        "secrets": [
            "APPS_IN_TOSS_API_KEY", "GODOT_ANALYTICS_CONFIG_JSON_BASE64",
            "VITE_FIREBASE_API_KEY", "VITE_GA4_MP_API_SECRET",
            "VITE_TOSS_FULLSCREEN_AD_GROUP_ID", "VITE_TOSS_INTERSTITIAL_AD_GROUP_ID",
            "VITE_TOSS_LEVEL_REWARD_AD_GROUP_ID", "VITE_TOSS_REWARDED_AD_GROUP_ID",
        ],
    },
    "godot-deploy-google-play": {
        "permissions": {"contents": "read", "id-token": "write"},
        "secrets": [
            "FIREBASE_ANDROID_API_KEY", "FIREBASE_ANDROID_GOOGLE_SERVICES_JSON_BASE64",
            "GODOT_ANALYTICS_CONFIG_JSON_BASE64", "GOOGLE_PLAY_UPLOAD_KEYSTORE_BASE64",
            "GOOGLE_PLAY_UPLOAD_KEYSTORE_PASSWORD", "GOOGLE_PLAY_UPLOAD_KEY_PASSWORD",
        ],
    },
    "godot-deploy-app-store": {
        "permissions": {"contents": "read"},
        "secrets": [
            "APPLE_DISTRIBUTION_CERTIFICATE_BASE64", "APPLE_DISTRIBUTION_CERTIFICATE_PASSWORD",
            "APPLE_PROVISIONING_PROFILE_BASE64", "APPLE_KEYCHAIN_PASSWORD", "APPLE_TEAM_ID",
            "APP_STORE_CONNECT_API_KEY_ID", "APP_STORE_CONNECT_ISSUER_ID",
            "APP_STORE_CONNECT_PRIVATE_KEY_BASE64", "GODOT_ANALYTICS_CONFIG_JSON_BASE64",
        ],
    },
    "rn-deploy-ait": {
        "permissions": {"contents": "read", "packages": "read"},
        "secrets": ["APPS_IN_TOSS_API_KEY", "VITE_FIREBASE_API_KEY"],
    },
    "rn-deploy-google-play": {
        "permissions": {"contents": "read", "id-token": "write", "packages": "read"},
        "secrets": [
            "FIREBASE_ANDROID_GOOGLE_SERVICES_JSON_BASE64", "GOOGLE_PLAY_UPLOAD_KEYSTORE_BASE64",
            "GOOGLE_PLAY_UPLOAD_KEYSTORE_PASSWORD", "GOOGLE_PLAY_UPLOAD_KEY_PASSWORD",
        ],
    },
    "rn-deploy-app-store": {
        "permissions": {"contents": "read", "packages": "read"},
        "secrets": [
            "APPLE_DISTRIBUTION_CERTIFICATE_BASE64", "APPLE_DISTRIBUTION_CERTIFICATE_PASSWORD",
            "APPLE_PROVISIONING_PROFILE_BASE64", "APPLE_KEYCHAIN_PASSWORD", "APPLE_TEAM_ID",
            "APP_STORE_CONNECT_API_KEY_ID", "APP_STORE_CONNECT_ISSUER_ID",
            "APP_STORE_CONNECT_PRIVATE_KEY_BASE64",
            "FIREBASE_IOS_GOOGLE_SERVICE_INFO_PLIST_BASE64",
        ],
    },
    "release-tag": {"permissions": {"contents": "write"}, "secrets": []},
    "promote-google-play": {"permissions": {"contents": "read", "id-token": "write"}, "secrets": []},
    "rn-static-checks": {"permissions": {"contents": "read", "packages": "read"}, "secrets": []},
    "godot-checks": {"permissions": {"contents": "read"}, "secrets": []},
    "godot-pages": {
        "permissions": {"contents": "read", "pages": "write", "id-token": "write"},
        "secrets": [],
    },
    "cleanup-actions-storage": {"permissions": {"actions": "write", "contents": "read"}, "secrets": []},
}

PERMISSION_RANK = {"none": 0, "read": 1, "write": 2}
CENTRAL_USES = re.compile(
    r"^seorilabs/\.github/\.github/workflows/([a-z0-9-]+)\.yml@(\S+)$"
)
EXTERNAL_USES = re.compile(r"^([A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+)@(\S+)$")


def indent_of(line: str) -> int:
    return len(line) - len(line.lstrip(" "))


def parse_permissions(lines, start, base_indent):
    """`permissions:` 블록 하나를 {scope: level} 로 읽는다."""
    permissions = {}
    for line in lines[start:]:
        if line.strip() == "" or line.lstrip().startswith("#"):
            continue
        if indent_of(line) <= base_indent:
            break
        match = re.match(r"^\s*([a-z-]+):\s*(\S+)", line)
        if match is not None:
            permissions[match.group(1)] = match.group(2)
    return permissions


def parse_workflow(path: Path):
    """caller 하나에서 계약 검사에 필요한 최소 구조만 뽑는다."""
    lines = path.read_text(encoding="utf-8").split("\n")
    workflow_permissions = {}
    jobs = []
    current = None
    for index, line in enumerate(lines):
        if re.match(r"^permissions:\s*$", line):
            workflow_permissions = parse_permissions(lines, index + 1, 0)
            continue
        if re.match(r"^permissions:\s*\{\}\s*$", line):
            workflow_permissions = {}
            continue
        job = re.match(r"^  ([A-Za-z0-9_-]+):\s*$", line)
        if job is not None:
            current = {"name": job.group(1), "uses": None, "permissions": None, "secrets": None}
            jobs.append(current)
            continue
        if current is None:
            continue
        uses = re.match(r"^    uses:\s*['\"]?(\S+?)['\"]?\s*$", line)
        if uses is not None:
            current["uses"] = uses.group(1)
            continue
        if re.match(r"^    permissions:\s*$", line):
            current["permissions"] = parse_permissions(lines, index + 1, 4)
            continue
        if re.match(r"^    secrets:\s*$", line):
            names = []
            for follow in lines[index + 1:]:
                if follow.strip() == "" or follow.lstrip().startswith("#"):
                    continue
                if indent_of(follow) <= 4:
                    break
                match = re.match(r"^\s*([A-Za-z_][A-Za-z0-9_]*):", follow)
                if match is not None:
                    names.append(match.group(1))
            current["secrets"] = names
    return lines, workflow_permissions, jobs


def check_repository(root: Path):
    failures = []
    workflows = sorted((root / ".github" / "workflows").glob("*.yml"))
    if not workflows:
        return ["`.github/workflows`에 workflow가 없다."]

    for path in workflows:
        lines, workflow_permissions, jobs = parse_workflow(path)
        name = path.name

        for number, line in enumerate(lines, start=1):
            if re.match(r"^\s*runs-on:\s*['\"]?macos", line):
                failures.append(
                    f"{name}:{number}: Apple 빌드는 Xcode Cloud 로만 실행한다. macOS 러너를 쓰지 않는다."
                )
            if line.strip() == "secrets: inherit":
                failures.append(f"{name}:{number}: secret 을 상속한다. 이름을 1:1 로 명시 전달한다.")
            uses = re.search(r"uses:\s*['\"]?(\S+?)['\"]?\s*$", line)
            if uses is None:
                continue
            target = uses.group(1)
            if target.startswith("./") or target.startswith("docker://"):
                continue
            central = CENTRAL_USES.match(target)
            if central is not None:
                if central.group(2) != AUTHORITY_SHA:
                    failures.append(
                        f"{name}:{number}: org 정본 호출이 승인된 authority commit 이 아니다: {central.group(2)}"
                    )
                continue
            external = EXTERNAL_USES.match(target)
            if external is None:
                failures.append(f"{name}:{number}: 해석할 수 없는 uses: {target}")
            elif not SHA_PATTERN.match(external.group(2)):
                failures.append(
                    f"{name}:{number}: 외부 action 이 40자리 commit SHA 로 고정되지 않았다: {target}"
                )

        for job in jobs:
            target = job["uses"] or ""
            central = CENTRAL_USES.match(target)
            if central is None:
                continue
            contract = CENTRAL_CONTRACT.get(central.group(1))
            if contract is None:
                failures.append(f"{name}: 계약에 없는 org workflow 를 호출한다: {central.group(1)}")
                continue

            declared = sorted(contract["secrets"])
            passed = sorted(job["secrets"] or [])
            if declared != passed:
                failures.append(
                    f"{name}: job {job['name']} 의 secret 전달이 {central.group(1)} 선언과 다르다. "
                    f"기대={declared} 실제={passed}"
                )

            effective = job["permissions"] if job["permissions"] is not None else workflow_permissions
            for scope, level in contract["permissions"].items():
                granted = effective.get(scope, "none")
                if PERMISSION_RANK.get(granted, -1) < PERMISSION_RANK[level]:
                    failures.append(
                        f"{name}: job {job['name']} 의 권한이 {central.group(1)} 요구보다 낮다. "
                        f"{scope}: 기대>={level} 실제={granted}"
                    )
    return failures


def main() -> int:
    root = Path(sys.argv[1] if len(sys.argv) > 1 else Path(__file__).resolve().parents[1])
    failures = check_repository(root)
    for failure in failures:
        print(f"[workflow-contract] {failure}", file=sys.stderr)
    if failures:
        print(f"[workflow-contract] {len(failures)}건 실패", file=sys.stderr)
        return 1
    print("[workflow-contract] OK — uses SHA 고정, secret 명시 전달, 권한 하한 충족")
    return 0


if __name__ == "__main__":
    sys.exit(main())
