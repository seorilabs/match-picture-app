class_name MpAnalyticsEvents
extends RefCounted
## 계측 이벤트 계약.
##
## 이름과 파라미터를 코어가 소유한다. 어댑터가 각자 이름을 지으면 표면마다 지표가
## 갈라지고, 이름을 바꾸면 기존 리포트가 조용히 끊긴다.
##
## 이 게임은 Firebase 프로젝트 match-picture-app 의 GA4 스트림을 웹 구현 때부터 쓰고
## 있다. 그래서 이름을 새로 짓지 않고 그때 쓰던 것을 그대로 승계한다.

## 앱을 켰다. 실행당 한 번.
const GAME_OPEN := "game_open"
## 최초 실행 설명을 띄웠다 / 닫았다.
const TUTORIAL_BEGIN := "tutorial_begin"
const TUTORIAL_COMPLETE := "tutorial_complete"
## 한 판을 시작했다 / 끝냈다.
const LEVEL_START := "level_start"
const LEVEL_END := "level_end"
## 개인 최고 기록을 갱신했다.
const NEW_BEST_RECORD := "new_best_record"
## 순위표에 점수를 올렸다 / 순위표를 열었다.
const POST_SCORE := "post_score"
const LEADERBOARD_OPEN := "leaderboard_open"
## 기록을 공유했다.
const SHARE := "share"
## 전면광고를 띄웠다.
##
## GA4 앱 스트림의 예약어 ad_impression 을 피한 이름이다. 웹 구현에서 확인한 회피책이고
## 이름을 바꾸면 그때부터 쌓인 지표가 끊긴다.
const INTERSTITIAL_AD_IMPRESSION := "interstitial_ad_impression"
## 런타임 오류.
const SCRIPT_ERROR := "script_error"

## 이벤트마다 허용하는 파라미터. 여기 없는 키는 걸러낸다.
const ALLOWED_PARAMS := {
	GAME_OPEN: ["has_played", "has_best"],
	TUTORIAL_BEGIN: [],
	TUTORIAL_COMPLETE: [],
	LEVEL_START: ["deck_size", "is_retry"],
	LEVEL_END: ["success", "seconds", "wrong_count"],
	NEW_BEST_RECORD: ["seconds", "previous_seconds"],
	POST_SCORE: ["score", "market"],
	LEADERBOARD_OPEN: ["result"],
	SHARE: ["method", "result"],
	INTERSTITIAL_AD_IMPRESSION: ["ad_platform", "result"],
	SCRIPT_ERROR: ["message", "script"],
}


static func is_known(name: String) -> bool:
	return ALLOWED_PARAMS.has(name)


## 계약에 없는 키를 걸러낸 파라미터를 돌려준다.
##
## 오타 하나로 GA4 에 쓰레기 차원이 생기면 되돌리기 어렵다. 나가기 전에 막는다.
static func sanitize(name: String, params: Dictionary) -> Dictionary:
	var allowed: Array = ALLOWED_PARAMS.get(name, [])
	var cleaned := {}
	for key in params:
		if allowed.has(key):
			cleaned[key] = params[key]
	return cleaned
