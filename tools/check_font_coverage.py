#!/usr/bin/env python3
"""화면에 그리는 글자가 번들 폰트에 실제로 있는지 검사한다.

Godot 은 글리프가 없으면 조용히 두부 상자(코드포인트 네 자리를 그려 넣은 네모)를
그린다. 오류도 경고도 남기지 않으므로 캡처를 눈으로 보기 전에는 드러나지 않는다.

실제로 난 일: 안내 띠의 구분자로 가운뎃점(U+00B7)을 썼는데 도현체의 유니코드
cmap 에 그 글자가 없었다. 폰트에 레거시 Mac Roman cmap 서브테이블(platform 1)이
같이 들어 있어서, 서브테이블을 구분하지 않고 조회하면 0xB7 이 'summation' 으로
잡혀 "있다" 고 잘못 읽힌다. Godot 은 유니코드 서브테이블만 쓴다. 그래서 여기서도
`platformID == 3` 계열, 즉 유니코드 cmap 만 본다.

검사 대상은 도현체로 그리는 글자 전부다.
  - i18n/translations.csv 의 모든 칸
  - src/ui/ 와 autoload/ 의 문자열 리터럴

픽셀 폰트는 검사하지 않는다. 한글 글리프가 없는 것을 알고 쓰는 폰트이고,
autoload/ui.gd 가 FontVariation.fallbacks 로 도현체를 달아 두어 빠진 글자는
도현체로 떨어진다. 즉 도현체만 온전하면 두부가 나지 않는다.

fontTools 가 없으면 검사를 건너뛰고 0 으로 끝낸다. 이 저장소의 품질 게이트는
파이썬 표준 라이브러리만으로 돌아야 하고, 이 검사 하나 때문에 의존성을 늘리지
않는다. CI 에 fontTools 가 있으면 자동으로 켜진다.

실행: python3 tools/check_font_coverage.py
"""

from __future__ import annotations

import csv
import re
import sys
import unicodedata
from pathlib import Path

WORD_FONT = Path("godot/assets/fonts/DoHyeon-Regular.ttf")
TRANSLATIONS = Path("godot/i18n/translations.csv")
SOURCE_DIRS = [Path("godot/src/ui"), Path("godot/autoload")]

# GDScript 문자열 리터럴. 여는 따옴표와 같은 종류로 닫히는 한 줄짜리만 본다.
# 여러 줄 문자열(""" ... """)은 이 저장소의 UI 코드에 없다.
STRING_LITERAL = re.compile(r'"([^"\\\n]*(?:\\.[^"\\\n]*)*)"')

# 그릴 일이 없는 글자. 줄바꿈과 탭은 폰트가 아니라 레이아웃이 처리한다.
NEVER_DRAWN = set("\n\r\t")


def fail(problems: list[str]) -> int:
    for problem in problems:
        print("[font-coverage] %s" % problem)
    return 1


def unicode_codepoints(font_path: Path) -> set[int] | None:
    """폰트의 유니코드 cmap 이 덮는 코드포인트. fontTools 가 없으면 None."""
    try:
        from fontTools.ttLib import TTFont
    except ModuleNotFoundError:
        return None

    covered: set[int] = set()
    with TTFont(str(font_path), lazy=True) as font:
        for table in font["cmap"].tables:
            # isUnicode() 가 platform 0(Unicode) 과 platform 3(Windows) 을 함께
            # 받아 준다. platform 1(Macintosh) 은 여기서 빠진다. 바로 그 테이블이
            # 0xB7 을 summation 으로 들고 있어 오판의 원인이었다.
            if table.isUnicode():
                covered |= set(table.cmap.keys())
    return covered


def drawn_characters() -> dict[str, list[str]]:
    """그릴 수 있는 글자마다 어디서 왔는지 한 곳씩 기록한다."""
    seen: dict[str, list[str]] = {}

    def note(text: str, where: str) -> None:
        for char in text:
            if char in NEVER_DRAWN:
                continue
            seen.setdefault(char, []).append(where)

    if TRANSLATIONS.exists():
        with TRANSLATIONS.open(encoding="utf-8", newline="") as handle:
            for row_number, row in enumerate(csv.reader(handle), start=1):
                for cell in row:
                    note(cell, "%s:%d" % (TRANSLATIONS, row_number))

    for source_dir in SOURCE_DIRS:
        for path in sorted(source_dir.rglob("*.gd")):
            for line_number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
                stripped = line.lstrip()
                # 주석과 문서화 주석은 화면에 나가지 않는다.
                if stripped.startswith("#"):
                    continue
                for literal in STRING_LITERAL.findall(line):
                    note(literal, "%s:%d" % (path, line_number))

    return seen


def describe(char: str) -> str:
    try:
        name = unicodedata.name(char)
    except ValueError:
        name = "이름 없음"
    return "U+%04X %s (%s)" % (ord(char), char, name)


def main() -> int:
    if not WORD_FONT.exists():
        return fail(["단어 폰트가 없다: %s" % WORD_FONT])

    covered = unicode_codepoints(WORD_FONT)
    if covered is None:
        print("[font-coverage] SKIP — fontTools 가 없어 건너뛴다 (pip install fonttools)")
        return 0

    seen = drawn_characters()
    problems: list[str] = []
    for char in sorted(seen):
        if ord(char) in covered:
            continue
        origins = seen[char]
        problems.append(
            "%s 이(가) %s 에 없다. %s 에서 쓴다%s"
            % (
                describe(char),
                WORD_FONT.name,
                origins[0],
                (" 외 %d곳" % (len(origins) - 1)) if len(origins) > 1 else "",
            )
        )

    if problems:
        problems.append("두부 상자로 그려진다. 폰트에 있는 글자로 바꾼다.")
        return fail(problems)

    print(
        "[font-coverage] OK — %s 가 화면 글자 %d종을 모두 덮는다"
        % (WORD_FONT.name, len(seen))
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
