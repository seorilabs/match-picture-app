class_name MpGameCenterLeaderboard
extends MpLeaderboardPort
## App Store Game Center 순위표.
##
## GameCenterKit 은 GameKit 인증·제출·시스템 순위표를 담당한다. 콘솔에서 확정한 ID 가
## 비어 있거나 iOS GDExtension 이 없으면 포트가 비활성화돼 결과 화면에 버튼이 없다.

const SINGLETON_NAME := "GameCenterKit"

var _leaderboard_id := ""
var _game_center: Object


func _init() -> void:
	_leaderboard_id = MpLeaderboardSettings.game_center_leaderboard_id()
	if _leaderboard_id.is_empty() or not Engine.has_singleton(SINGLETON_NAME):
		return
	_game_center = Engine.get_singleton(SINGLETON_NAME)
	_game_center.authenticate()


static func has_configured_id() -> bool:
	return not MpLeaderboardSettings.game_center_leaderboard_id().is_empty()


func is_available() -> bool:
	return Platform.surface() == Platform.Surface.IOS and has_configured_id() and _game_center != null


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
