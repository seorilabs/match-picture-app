class_name MpLeaderboardSettings
extends RefCounted
## 콘솔에서 확정된 공개 순위표 ID를 읽는다.
##
## ProjectSettings는 빈 문자열을 에디터 저장 때 지울 수 있어, 꺼진 기본값을 보존하는
## 별도 파일을 쓴다. 설정 파일이 없거나 JSON이 깨져도 빈 값으로 취급해 기능은 꺼진다.

const CONFIG_PATH := "res://leaderboard.config.json"


static func play_games_project_id() -> String:
	return _value("play_games", "project_id")


static func play_games_leaderboard_id() -> String:
	return _value("play_games", "leaderboard_id")


static func game_center_leaderboard_id() -> String:
	return _value("game_center", "leaderboard_id")


static func _value(group: String, key: String) -> String:
	var file := FileAccess.open(CONFIG_PATH, FileAccess.READ)
	if file == null:
		return ""
	var source := file.get_as_text()
	file.close()
	var parsed: Variant = JSON.parse_string(source)
	if not (parsed is Dictionary):
		return ""
	var values: Variant = parsed.get(group, {})
	if not (values is Dictionary):
		return ""
	return String(values.get(key, "")).strip_edges()
