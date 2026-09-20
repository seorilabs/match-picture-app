class_name MpLeaderboardPort
extends RefCounted
## 순위표 추상.
##
## v1 은 앱인토스 게임센터만 붙는다. Play Games Services 와 GameKit 은 같은 인터페이스
## 뒤에서 UNSUPPORTED 를 돌려주고, 결과 화면은 is_available() 이 false 면 버튼을
## 아예 그리지 않는다. 나중에 채울 때 화면 코드는 건드리지 않는다.

enum Result {
	SUCCESS,
	UNSUPPORTED,
	ERROR,
}


func is_available() -> bool:
	return false


## 점수는 MpBestRecord.to_leaderboard_score 가 만든 값을 그대로 넘긴다.
func submit_score(_score: int) -> Result:
	return Result.UNSUPPORTED


func open_board() -> Result:
	return Result.UNSUPPORTED
