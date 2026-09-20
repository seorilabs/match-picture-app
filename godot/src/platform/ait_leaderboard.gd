class_name MpAitLeaderboard
extends MpLeaderboardPort
## 앱인토스 게임센터 순위표.
##
## 점수는 낮은 기록이 높은 점수가 되게 뒤집어 보낸다. 게임센터가 내림차순만 지원한다.
## 변환은 코어(MpBestRecord.to_leaderboard_score)가 하고 여기서는 넘기기만 한다.


func is_available() -> bool:
	var bridge := Platform.ait_bridge()
	if bridge == null:
		return false
	return bool(bridge.leaderboardSupported())


func submit_score(score: int) -> Result:
	var bridge := Platform.ait_bridge()
	if bridge == null:
		return Result.UNSUPPORTED
	return _to_result(String(bridge.submitScore(score)))


func open_board() -> Result:
	var bridge := Platform.ait_bridge()
	if bridge == null:
		return Result.UNSUPPORTED
	return _to_result(String(bridge.openLeaderboard()))


func _to_result(status: String) -> Result:
	match status:
		"SUCCESS":
			return Result.SUCCESS
		"UNSUPPORTED":
			return Result.UNSUPPORTED
		_:
			return Result.ERROR
