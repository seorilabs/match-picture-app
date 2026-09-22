class_name MpGooglePlayLeaderboard
extends MpLeaderboardPort
## Google Play Games Services 순위표.
##
## 설정 파일의 두 ID 와 Android 플러그인이 모두 있을 때만 켜진다. ID 를 비워 둔
## 기본 빌드는 버튼조차 보이지 않으므로, 콘솔 리소스를 만들기 전에는 SDK 호출이 없다.

const PLUGIN_NAME := "GodotPlayGameServices"

var _leaderboard_id := ""
var _plugin: Object


func _init() -> void:
	_leaderboard_id = MpLeaderboardSettings.play_games_leaderboard_id()
	if not has_configured_ids() or not Engine.has_singleton(PLUGIN_NAME):
		return
	if GodotPlayGameServices.initialize() != GodotPlayGameServices.PlayGamesPluginError.OK:
		return
	_plugin = GodotPlayGameServices.android_plugin
	# 인증 상태를 확인하면 Play Games 가 필요한 로그인 UI 를 맡는다. 제출·화면 열기는
	# 비동기 API 이므로 여기서는 요청을 받았다는 결과만 포트로 돌려준다.
	_plugin.isAuthenticated()


static func has_configured_ids() -> bool:
	return not MpLeaderboardSettings.play_games_project_id().is_empty() and not MpLeaderboardSettings.play_games_leaderboard_id().is_empty()


func is_available() -> bool:
	return Platform.surface() == Platform.Surface.ANDROID and has_configured_ids() and _plugin != null


func submit_score(score: int) -> Result:
	if not is_available():
		return Result.UNSUPPORTED
	_plugin.submitScore(_leaderboard_id, score)
	return Result.SUCCESS


func open_board() -> Result:
	if not is_available():
		return Result.UNSUPPORTED
	_plugin.showLeaderboard(_leaderboard_id)
	return Result.SUCCESS
