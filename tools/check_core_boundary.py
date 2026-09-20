#!/usr/bin/env python3
"""godot/src/core/ 가 엔진과 SDK로 새지 않는지 검사한다.

코어는 순수 규칙만 담는다. 노드도, 파일도, 플랫폼 SDK도 모른다. 그래야
헤드리스에서 게임 한 판을 통째로 시뮬레이션할 수 있고, 표면이 늘어도 규칙이
표면을 따라 갈라지지 않는다. 어댑터는 src/platform/ 에만 둔다.

실행: python3 tools/check_core_boundary.py [core_dir]
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

DEFAULT_CORE_DIR = Path("godot/src/core")

# 코어에 있으면 안 되는 것들. (패턴, 왜 안 되는지)
FORBIDDEN: list[tuple[str, str]] = [
    (r"\bJavaScriptBridge\b", "웹 브리지는 src/platform/ 어댑터가 가진다"),
    (r"\bEngine\.get_singleton\b", "네이티브 플러그인 접근은 어댑터가 가진다"),
    (r"\bFileAccess\b", "파일 접근은 MpStoragePort 뒤에 둔다"),
    (r"\bDirAccess\b", "파일 접근은 MpStoragePort 뒤에 둔다"),
    (r"\bProjectSettings\b", "설정 읽기는 어댑터가 가진다"),
    (r"\bDisplayServer\b", "표면 판정은 Platform autoload 가 가진다"),
    (r"\bTranslationServer\b", "로케일은 Locale autoload 가 가진다"),
    (r"\bget_tree\(\)", "코어는 씬 트리를 모른다"),
    (r"\bget_node\b", "코어는 노드를 모른다"),
    (r"^extends\s+Node\b", "코어는 RefCounted/Resource 를 상속한다"),
    (r"^extends\s+Control\b", "코어는 화면 부품이 아니다"),
    (r"^extends\s+SceneTree\b", "코어는 씬 트리를 모른다"),
    # autoload 싱글턴 이름. 코어가 이것을 부르면 주입 대신 전역 의존이 된다.
    (r"(?<![\w.])(?:Platform|Save|Locale|Ui|Audio)\s*\.", "autoload 대신 포트를 주입받는다"),
]

# OS 는 OS.get_locale_language() 처럼 쓰임이 넓어 별도로 다룬다.
OS_PATTERN = re.compile(r"(?<![\w.])OS\s*\.")

COMMENT = re.compile(r"^\s*#")


def check_file(path: Path) -> list[str]:
    problems: list[str] = []
    for lineno, raw in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        line = raw.split("##", 1)[0]
        if COMMENT.match(raw):
            continue
        for pattern, reason in FORBIDDEN:
            if re.search(pattern, line, re.MULTILINE):
                problems.append(f"{path}:{lineno}: {raw.strip()}  ← {reason}")
        if OS_PATTERN.search(line):
            problems.append(f"{path}:{lineno}: {raw.strip()}  ← OS 접근은 Platform autoload 가 가진다")
    return problems


def main(argv: list[str]) -> int:
    core_dir = Path(argv[1]) if len(argv) > 1 else DEFAULT_CORE_DIR
    if not core_dir.is_dir():
        print(f"코어 디렉터리가 없다: {core_dir}", file=sys.stderr)
        return 2

    sources = sorted(core_dir.rglob("*.gd"))
    if not sources:
        print(f"검사할 .gd 파일이 없다: {core_dir}", file=sys.stderr)
        return 2

    problems: list[str] = []
    for source in sources:
        problems.extend(check_file(source))

    if problems:
        print(f"[core-boundary] {core_dir} 가 엔진/SDK 로 샜다:", file=sys.stderr)
        for problem in problems:
            print(f"  {problem}", file=sys.stderr)
        return 1

    print(f"[core-boundary] {len(sources)}개 파일 통과: {core_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
