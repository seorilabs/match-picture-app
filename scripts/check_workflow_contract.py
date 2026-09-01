#!/usr/bin/env python3
"""org 재사용 워크플로우 caller 계약과 릴리즈 버전 authority 를 기계적으로 검사한다.

계약(seorilabs/.github, release-version-authority-v1):
- AC-1 모든 `uses:`는 immutable commit SHA로 고정한다. org 정본 호출은 승인된 authority
  commit 하나만 쓴다. floating ref는 release binding의 config revision을 고정할 수 없다.
- AC-2 caller는 제거된 version 입력(`version_name`, `version_code`, `version_script`)과
  더 이상 존재하지 않는 `runs_on`을 넘기지 않는다.
- AC-3 저장소 로컬 version resolver(`scripts/resolve-release-version.mjs`)를 두지 않는다.
- AC-4 마켓 config JSON은 version authority를 갖지 않는다.
- AC-5 caller는 secret을 상속하지 않는다. called workflow가 선언한 이름만 1:1로 전달한다.
- AC-6 caller가 부여하는 권한은 called workflow가 선언한 권한보다 낮지 않아야 한다.
- AC-7 Apple archive/upload는 Xcode Cloud가 표준 실행 환경이다. GitHub Actions macOS
  러너로 우회하지 않는다.

의존성 없이 python3만으로 동작한다.
"""
from __future__ import annotations

import json
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

# 중앙 워크플로우가 더 이상 받지 않는 caller 입력. 남아 있으면 workflow_call 이 실패한다.
REMOVED_VERSION_INPUTS = ("version_name", "version_code", "version_script")
OBSOLETE_INPUTS_BY_WORKFLOW = {
    "release-tag": ("runs_on",),
    "godot-deploy-google-play": ("runs_on",),
}
# 저장소 로컬 version resolver. 파생 규칙이 중앙과 갈라지면 readback 이 fail-closed 된다.
FORBIDDEN_RESOLVER = "scripts/resolve-release-version.mjs"
# 마켓 config JSON 의 version authority. 값이 필요하면 태그 파생값을 주입한다.
MARKET_CONFIG_VERSION_KEYS = (
    ("play-store/google-play.config.json", ("versionName", "versionCode")),
    ("app-store/app-store.config.json", ("version",)),
)
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


def parse_with_inputs(lines, start):
    """caller job 하나가 넘기는 `with:` 입력 이름을 모은다."""
    names = []
    for line in lines[start:]:
        if line.strip() == "" or line.lstrip().startswith("#"):
            continue
        if indent_of(line) <= 4:
            break
        match = re.match(r"^      ([a-z0-9_]+):", line)
        if match is not None:
            names.append(match.group(1))
    return names


def check_release_authority(root: Path):
    """AC-3, AC-4: 저장소가 버전 authority 를 갖지 않는지 확인한다."""
    failures = []
    if (root / FORBIDDEN_RESOLVER).exists():
        failures.append(
            f"{FORBIDDEN_RESOLVER}: 저장소 로컬 version resolver 는 authority 가 아니다. 제거한다."
        )
    for relative, keys in MARKET_CONFIG_VERSION_KEYS:
        path = root / relative
        if not path.exists():
            continue
        try:
            release = json.loads(path.read_text(encoding="utf-8")).get("release") or {}
        except json.JSONDecodeError as error:
            failures.append(f"{relative}: JSON 을 읽을 수 없다: {error}")
            continue
        for key in keys:
            if key in release:
                failures.append(
                    f"{relative}#release.{key}: 마켓 config JSON 은 version authority 가 아니다."
                )
    return failures


def check_repository(root: Path):
    failures = check_release_authority(root)
    workflows = sorted((root / ".github" / "workflows").glob("*.yml"))
    if not workflows:
        return failures + ["`.github/workflows`에 workflow가 없다."]

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

            passed_inputs = []
            for index, line in enumerate(lines):
                if line.strip().startswith("uses:") and target in line:
                    for follow_index in range(index + 1, len(lines)):
                        if re.match(r"^    with:\s*$", lines[follow_index]):
                            passed_inputs = parse_with_inputs(lines, follow_index + 1)
                            break
                        if lines[follow_index].strip() and indent_of(lines[follow_index]) <= 2:
                            break
                    break
            for input_name in passed_inputs:
                if input_name in REMOVED_VERSION_INPUTS:
                    failures.append(
                        f"{name}: job {job['name']} 이 제거된 version 입력 {input_name} 을 넘긴다."
                    )
                elif input_name in OBSOLETE_INPUTS_BY_WORKFLOW.get(central.group(1), ()):
                    failures.append(
                        f"{name}: job {job['name']} 이 {central.group(1)} 에서 제거된 입력 "
                        f"{input_name} 을 넘긴다."
                    )

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
    print(
        "[workflow-contract] OK — uses SHA 고정, 제거된 version 입력 없음, "
        "저장소 로컬 resolver 없음, 마켓 config version authority 없음, "
        "secret 명시 전달, 권한 하한 충족, macOS 우회 없음"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
