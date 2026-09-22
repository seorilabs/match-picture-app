#!/usr/bin/env python3
"""vendoring 한 네이티브 순위표 플러그인과 비활성 기본값을 검사한다.

콘솔 ID 는 저장소에 만들거나 추측하지 않는다. 둘 중 하나라도 비어 있으면 어댑터가
is_available() == false 로 남는 것이 이 검사의 핵심 계약이다.

실행: python3 tools/check_leaderboard_bundle.py
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PLAY_GAMES_VERSION = "3.4.0"
GAME_CENTER_VERSION = "1.0.1"

REQUIRED_PAYLOADS = [
    "godot/addons/GodotPlayGameServices/export_plugin.gd",
    "godot/addons/GodotPlayGameServices/scripts/autoloads/godot_play_game_services.gd",
    "godot/addons/GodotPlayGameServices/scripts/marshalling/json_marshaller.gd",
    "godot/addons/GodotPlayGameServices/bin/debug/GodotPlayGameServices-debug.aar",
    "godot/addons/GodotPlayGameServices/bin/release/GodotPlayGameServices-release.aar",
    "godot/addons/gamecenter/bin/libgamecenter.ios.xcframework/Info.plist",
    # 시뮬레이터 슬라이스(83MB)는 넣지 않는다. 이 저장소의 iOS 경로는 CI 에서
    # archive 만 만들고 시뮬레이터로 돌리지 않는다. 필요해지면 릴리스에서 다시 받는다.
    "godot/addons/gamecenter/bin/libgamecenter.ios.xcframework/ios-arm64/libgamecenter.ios.template_release.arm64.a",
    "godot/addons/gamecenter/bin/libgamecenter.macos.template_release.universal.dylib",
]

WEB_EXCLUDES = ["addons/GodotPlayGameServices/**", "addons/gamecenter/**"]
GAME_CENTER_RUNTIME_DESCRIPTOR = "godot/addons/gamecenter/bin/gamecenter.gdextension"
GAME_CENTER_IGNORED_DIRECTORY = "godot/addons/gamecenter/bin/.gdignore"
GAME_CENTER_EXPORT_HOOKS = [
    "add_file(EXPORTED_DESCRIPTOR_PATH, descriptor, false)",
    "add_shared_object(IOS_XCFRAMEWORK_PATH, PackedStringArray([\"ios\"]), \"\")",
    "add_apple_embedded_platform_cpp_code(",
    "add_apple_embedded_platform_linker_flags(\"-Wl,-U,_%s\" % ENTRY_SYMBOL)",
    "add_apple_embedded_platform_framework(\"GameKit.framework\")",
]


def fail(problems: list[str]) -> int:
    for problem in problems:
        print(f"[leaderboard] {problem}", file=sys.stderr)
    return 1


def section(text: str, name: str) -> str | None:
    match = re.search(
        rf"(?ms)^\[{re.escape(name)}\]\n(.*?)(?=^\[[^\n]+\]\n|\Z)", text
    )
    return match.group(1) if match else None


def value(text: str, section_name: str, key: str) -> str | None:
    body = section(text, section_name)
    if body is None:
        return None
    match = re.search(rf'(?m)^{re.escape(key)}="([^"]*)"$', body)
    return match.group(1) if match else None


def preset(text: str, name: str) -> str | None:
    match = re.search(
        rf'(?ms)^\[preset\.\d+\]\n.*?^name="{re.escape(name)}"\n(.*?)(?=^\[preset\.\d+\]\n|\Z)',
        text,
    )
    return match.group(1) if match else None


def optional_identifier(config: dict[str, object], problems: list[str], group: str, key: str) -> str:
    values = config.get(group)
    if not isinstance(values, dict):
        problems.append(f"leaderboard.config.json {group} 객체가 없다")
        return ""
    identifier = values.get(key)
    if not isinstance(identifier, str):
        problems.append(f"leaderboard.config.json {group}.{key} 문자열이 없다")
        return ""
    if identifier != identifier.strip():
        problems.append(f"{group}.{key} 앞뒤 공백을 지운다")
    if identifier.upper().startswith(("TODO", "YOUR_", "PLACEHOLDER")):
        problems.append(f"{group}.{key} 에 추측용 placeholder 를 넣지 않는다")
    return identifier


def main() -> int:
    problems: list[str] = []
    project = (ROOT / "godot/project.godot").read_text(encoding="utf-8")
    presets = (ROOT / "godot/export_presets.cfg").read_text(encoding="utf-8")
    config_path = ROOT / "godot/leaderboard.config.json"
    try:
        config = json.loads(config_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        return fail([f"순위표 설정 파일을 읽지 못했다: {error}"])
    if not isinstance(config, dict):
        return fail(["순위표 설정 파일의 최상위 값은 객체여야 한다"])

    expected_versions = {
        "godot/addons/GodotPlayGameServices/plugin.cfg": PLAY_GAMES_VERSION,
        "godot/addons/gamecenter/plugin.cfg": GAME_CENTER_VERSION,
    }
    for relative, version in expected_versions.items():
        path = ROOT / relative
        if not path.is_file() or f'version="{version}"' not in path.read_text(encoding="utf-8"):
            problems.append(f"플러그인 버전이 {version} 이 아니다: {relative}")

    for relative in REQUIRED_PAYLOADS:
        path = ROOT / relative
        if not path.is_file() or path.stat().st_size <= 64:
            problems.append(f"네이티브 payload 가 비었거나 없다: {relative}")

    game_center_descriptor = ROOT / GAME_CENTER_RUNTIME_DESCRIPTOR
    if not game_center_descriptor.is_file():
        problems.append("GameCenterKit iOS GDExtension 설명자가 bin 에 없다")
    elif 'ios.release = "res://addons/gamecenter/bin/libgamecenter.ios.xcframework"' not in game_center_descriptor.read_text(encoding="utf-8"):
        problems.append("GameCenterKit iOS 설명자가 XCFramework 를 가리키지 않는다")
    if not (ROOT / GAME_CENTER_IGNORED_DIRECTORY).is_file():
        problems.append("GameCenterKit bin 을 에디터 GDExtension 스캔에서 뺄 .gdignore 가 없다")
    if (ROOT / "godot/addons/gamecenter/gamecenter.gdextension").exists():
        problems.append("GameCenterKit 설명자를 bin 밖에 두면 Linux 에디터가 iOS 라이브러리를 읽는다")
    game_center_exporter = (ROOT / "godot/addons/gamecenter/plugin.gd")
    if not game_center_exporter.is_file():
        problems.append("GameCenterKit iOS export 훅이 없다")
    else:
        exporter_source = game_center_exporter.read_text(encoding="utf-8")
        for hook in GAME_CENTER_EXPORT_HOOKS:
            if hook not in exporter_source:
                problems.append(f"GameCenterKit iOS export 훅이 빠졌다: {hook}")

    play_games_exporter = ROOT / "godot/addons/GodotPlayGameServices/export_plugin.gd"
    if 'if not _supports_platform(get_export_platform()):' not in play_games_exporter.read_text(encoding="utf-8"):
        problems.append("Play Games exporter 가 Android 밖의 export 를 건드린다")

    play_project_id = optional_identifier(config, problems, "play_games", "project_id")
    play_leaderboard_id = optional_identifier(config, problems, "play_games", "leaderboard_id")
    optional_identifier(config, problems, "game_center", "leaderboard_id")

    if "GodotPlayGameServices/plugin.cfg" not in project or "gamecenter/plugin.cfg" not in project:
        problems.append("ProjectSettings 가 두 순위표 export 플러그인을 켜지 않는다")
    if "GodotPlayGameServices=" not in project:
        problems.append("GodotPlayGameServices autoload 가 없다")

    android = preset(presets, "Android")
    ios = preset(presets, "iOS")
    web = preset(presets, "Web")
    android_game_id = ""
    plugin_enabled = None
    if android is None:
        problems.append("Android preset 을 찾지 못했다")
    else:
        game_id_match = re.search(r'(?m)^godot_play_game_services/game_id="([^"]*)"$', android)
        if game_id_match is None:
            problems.append("Android export 의 Play Games project ID 설정이 없다")
        else:
            android_game_id = game_id_match.group(1)
        plugin_match = re.search(r"(?m)^plugins/GodotPlayGameServices=(true|false)$", android)
        if plugin_match is None:
            problems.append("Android export 의 GodotPlayGameServices 켜기 설정이 없다")
        else:
            plugin_enabled = plugin_match.group(1) == "true"

    if bool(play_project_id) != bool(play_leaderboard_id):
        problems.append("Play Games project ID 와 leaderboard ID 는 함께 넣거나 함께 비운다")
    elif play_project_id:
        if android_game_id != play_project_id:
            problems.append("Android export 와 순위표 설정 파일의 Play Games project ID 가 다르다")
        if plugin_enabled is not True:
            problems.append("설정된 Play Games ID 에서는 Android export 플러그인을 켠다")
    elif android_game_id or plugin_enabled is not False:
        problems.append("비어 있는 Play Games ID 에서는 Android export 플러그인과 game ID 를 끈다")
    if ios is None or "entitlements/game_center=true" not in ios:
        problems.append("iOS export 가 Game Center entitlement 를 켜지 않는다")

    if web is None:
        problems.append("Web preset 을 찾지 못했다")
    else:
        # preset 본문에는 section 머리글이 없으므로 직접 한 줄만 읽는다.
        exclude_match = re.search(r'(?m)^exclude_filter="([^"]*)"$', web)
        excludes = exclude_match.group(1) if exclude_match else ""
        for needle in WEB_EXCLUDES:
            if needle not in excludes:
                problems.append(f"Web export 가 네이티브 순위표 바이너리를 빼지 않는다: {needle}")

    if android is None or "addons/gamecenter/**" not in android:
        problems.append("Android export 가 iOS GameCenterKit 을 빼지 않는다")
    if ios is None or "addons/GodotPlayGameServices/**" not in ios:
        problems.append("iOS export 가 Android Play Games 플러그인을 빼지 않는다")

    if problems:
        return fail(problems)
    print(
        "[leaderboard] OK — Play Games %s, GameCenterKit %s, payload %d개, 기본 ID 비어 있음"
        % (PLAY_GAMES_VERSION, GAME_CENTER_VERSION, len(REQUIRED_PAYLOADS))
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
