class_name MpGooglePlayLeaderboard
extends MpLeaderboardPort
## Google Play Games Services 순위표.
##
## 설정 파일의 두 ID 와 Android 플러그인이 모두 있을 때만 켜진다. ID 를 비워 둔
## 기본 빌드는 버튼조차 보이지 않으므로, 콘솔 리소스를 만들기 전에는 SDK 호출이 없다.

const PLUGIN_NAME := "GodotPlayGameServices"

var _leaderboard_id := ""
var _plugin: Object
var _authenticated := false


func _init(plugin: Object = null) -> void:
	_leaderboard_id = MpLeaderboardSettings.play_games_leaderboard_id()
	if not has_configured_ids():
		return
	if plugin != null:
		_bind_plugin(plugin)
		return
	if not Engine.has_singleton(PLUGIN_NAME):
		return
	if GodotPlayGameServices.initialize() != GodotPlayGameServices.PlayGamesPluginError.OK:
		return
	_bind_plugin(GodotPlayGameServices.android_plugin)


func _bind_plugin(plugin: Object) -> void:
	_plugin = plugin
	_plugin.userAuthenticated.connect(_on_user_authenticated)
	# Play Games 는 현재 로그인 상태를 비동기로 보낸다. 응답 전에는 버튼과 점수 제출을
	# 모두 끄며, 거절·실패도 false 신호로 같은 상태에 남는다.
	_plugin.isAuthenticated()


func _on_user_authenticated(authenticated: bool) -> void:
	_authenticated = authenticated


static func has_configured_ids() -> bool:
	return not MpLeaderboardSettings.play_games_project_id().is_empty() and not MpLeaderboardSettings.play_games_leaderboard_id().is_empty()


func is_authenticated() -> bool:
	return _authenticated


func is_available() -> bool:
	return _is_available_on(Platform.surface())


func _is_available_on(surface: int) -> bool:
	return surface == Platform.Surface.ANDROID and has_configured_ids() and _plugin != null and _authenticated


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
