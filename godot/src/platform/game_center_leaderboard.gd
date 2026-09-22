class_name MpGameCenterLeaderboard
extends MpLeaderboardPort
## App Store Game Center 순위표.
##
## GameCenterKit 은 GameKit 인증·제출·시스템 순위표를 담당한다. 콘솔에서 확정한 ID 가
## 비어 있거나 iOS GDExtension 이 없으면 포트가 비활성화돼 결과 화면에 버튼이 없다.

const SINGLETON_NAME := "GameCenterKit"

var _leaderboard_id := ""
var _game_center: Object
var _authenticated := false


func _init(game_center: Object = null) -> void:
	_leaderboard_id = MpLeaderboardSettings.game_center_leaderboard_id()
	if _leaderboard_id.is_empty():
		return
	if game_center != null:
		_bind_game_center(game_center)
		return
	if not Engine.has_singleton(SINGLETON_NAME):
		return
	_bind_game_center(Engine.get_singleton(SINGLETON_NAME))


func _bind_game_center(game_center: Object) -> void:
	_game_center = game_center
	_game_center.authenticated.connect(_on_authenticated)
	_authenticated = _game_center.is_authenticated()
	if not _authenticated:
		_game_center.authenticate()


func _on_authenticated(ok: bool, _error: String) -> void:
	_authenticated = ok


static func has_configured_id() -> bool:
	return not MpLeaderboardSettings.game_center_leaderboard_id().is_empty()


func is_authenticated() -> bool:
	return _authenticated


func is_available() -> bool:
	return _is_available_on(Platform.surface())


func _is_available_on(surface: int) -> bool:
	return surface == Platform.Surface.IOS and has_configured_id() and _game_center != null and _authenticated


func submit_score(score: int) -> Result:
	if not is_available():
		return Result.UNSUPPORTED
	_game_center.submit_score(_leaderboard_id, score)
	return Result.SUCCESS


func open_board() -> Result:
	if not is_available():
		return Result.UNSUPPORTED
	_game_center.show_leaderboard(_leaderboard_id)
	return Result.SUCCESS
