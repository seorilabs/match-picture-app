#!/usr/bin/env python3
"""배포 워크플로 caller 가 지켜야 하는 것들을 검사한다.

여기 있는 것들은 전부 한 번씩 실제로 깨졌거나, 깨지면 조용히 잘못된 결과가 나가는
종류다. YAML 파서를 쓰지 않고 문자열로 본다. 검사 대상이 caller 몇 개뿐이라
의존성을 하나 늘릴 이유가 없다.

실행: python3 tools/check_release_workflow_contract.py
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WORKFLOWS = ROOT / ".github/workflows"

# 마켓 배포 caller 와 각자 불러야 하는 중앙 재사용 워크플로.
DEPLOY_CALLERS = {
    "deploy-apps-in-toss.yml": "godot-deploy-ait.yml",
    "deploy-google-play.yml": "godot-deploy-google-play.yml",
    "deploy-app-store.yml": "godot-deploy-app-store.yml",
    "godot-checks.yml": "godot-checks.yml",
}

problems: list[str] = []


def fail(message: str) -> None:
    problems.append(message)


def read(name: str) -> str:
    path = WORKFLOWS / name
    if not path.is_file():
        fail(f"워크플로가 없다: {name}")
        return ""
    return path.read_text(encoding="utf-8")


def main() -> int:
    for name, central in DEPLOY_CALLERS.items():
        text = read(name)
        if not text:
            continue

        # 웹 시절 caller 가 남아 있으면 Godot 산출물을 만들지 못한다.
        if "rn-deploy" in text or "rn-static-checks" in text:
            fail(f"{name}: RN 재사용 워크플로를 아직 부른다.")

        if f"seorilabs/.github/.github/workflows/{central}@main" not in text:
            fail(f"{name}: {central}@main 을 부르지 않는다.")

        # 중앙 정본은 main 을 따른다. SHA 핀은 릴리스 계약 갱신을 따라가지 못한다.
        for ref in re.findall(r"seorilabs/\.github/\.github/workflows/[\w.-]+@([\w.]+)", text):
            if ref != "main":
                fail(f"{name}: 중앙 워크플로 ref 가 main 이 아니다({ref}).")

        # 중앙 기본값은 4.6.3 이다. 명시하지 않으면 조직 표준과 다른 엔진으로 빌드된다.
        if "godot_version:" in text and '"4.7.2"' not in text:
            fail(f"{name}: godot_version 이 4.7.2 로 고정돼 있지 않다.")

        # Godot 프로젝트가 루트가 아니다. 비우면 저장소 루트를 프로젝트로 본다.
        if "project_dir: godot" not in text:
            fail(f"{name}: project_dir 을 godot 으로 명시하지 않았다.")

    # public 저장소는 ARC 러너를 받지 못한다. 기본값이면 job 이 큐에 남는다.
    for name in ("deploy-apps-in-toss.yml", "godot-checks.yml"):
        text = read(name)
        if text and "runs_on: ubuntu-latest" not in text:
            fail(f"{name}: runs_on 을 ubuntu-latest 로 명시하지 않았다(public 저장소).")

    # 스토어 식별자는 업로드 직전 대조값이다. 저장소 설정과 어긋나면 다른 앱으로 올라간다.
    play_config = json.loads((ROOT / "play-store/google-play.config.json").read_text(encoding="utf-8"))
    package_name = play_config["packageName"]
    for name in ("deploy-google-play.yml", "promote-google-play.yml"):
        text = read(name)
        if text and f'package_name: "{package_name}"' not in text:
            fail(f"{name}: package_name 이 play-store 설정({package_name})과 다르다.")

    app_config = json.loads((ROOT / "app-store/app-store.config.json").read_text(encoding="utf-8"))
    bundle_id = app_config["bundleId"]
    text = read("deploy-app-store.yml")
    if text and f"bundle_id: {bundle_id}" not in text:
        fail(f"deploy-app-store.yml: bundle_id 가 app-store 설정({bundle_id})과 다르다.")

    # export preset 이름은 caller 입력과 같아야 한다. 다르면 중앙이 fail-closed 한다.
    presets = (ROOT / "godot/export_presets.cfg").read_text(encoding="utf-8")
    for preset in ("Web", "Android", "iOS"):
        if f'name="{preset}"' not in presets:
            fail(f"export_presets.cfg 에 {preset} 프리셋이 없다.")

    # AIT 래퍼 경로가 실제로 있어야 한다.
    text = read("deploy-apps-in-toss.yml")
    match = re.search(r"wrapper_dir: (\S+)", text)
    if match and not (ROOT / match.group(1)).is_dir():
        fail(f"deploy-apps-in-toss.yml: wrapper_dir 경로가 없다({match.group(1)}).")

    # Backoffice 의 마켓 타깃 감지가 이 파일의 존재로 appstore 를 판정한다.
    if not (WORKFLOWS / "deploy-app-store.yml").is_file():
        fail("deploy-app-store.yml 이 없으면 Backoffice 에서 App Store 배포 옵션이 사라진다.")

    if problems:
        for problem in problems:
            print(f"[workflow-contract] {problem}", file=sys.stderr)
        return 1

    print(f"[workflow-contract] OK — caller {len(DEPLOY_CALLERS)}개 통과")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
