class_name MpLeaderboardPort
extends RefCounted
## 순위표 추상.
##
## 앱인토스는 Game Center 브리지를, Google Play 는 Play Games Services 를, App Store 는
## GameKit 을 이 인터페이스 뒤에 둔다. 설정 파일 또는 현재 표면이 지원하지 않으면
## is_available() 이 false 가 되어 결과 화면이 버튼을 아예 그리지 않는다.

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
