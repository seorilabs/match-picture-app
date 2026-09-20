class_name MpBestRecord
extends RefCounted
## 개인 최고 기록 판정.
##
## 원본에는 기록 저장이 없었다. 결과 화면의 숫자는 메모리에만 있다가 앱을 끄면 사라졌다.
## 재도전 동기를 만들기 위해 이번에 더한다.

const BEST_KEY := "best_seconds"
const CLEAR_COUNT_KEY := "clear_count"

## 기록이 없는 상태. 0 은 "0초에 깼다"가 아니라 "아직 없다"를 뜻한다.
const NO_RECORD := 0.0


static func has_record(best_seconds: float) -> bool:
	return best_seconds > NO_RECORD


## 새 기록이 신기록인지. 낮을수록 좋은 게임이다.
static func is_new_best(candidate_seconds: float, best_seconds: float) -> bool:
	if candidate_seconds <= NO_RECORD:
		return false
	if not has_record(best_seconds):
		return true
	return candidate_seconds < best_seconds


## 표시용이 아니라 판정용이라 초를 실수 그대로 남긴다.
##
## 정수로 깎아 두면 23.9초와 23.1초가 같은 기록이 되어 갱신 판정이 흐려진다.
## 화면에 그릴 때만 MpRules.format_seconds 로 버린다.
static func merge(previous: Dictionary, candidate_seconds: float) -> Dictionary:
	var merged := previous.duplicate(true)
	var best := float(previous.get(BEST_KEY, NO_RECORD))
	if is_new_best(candidate_seconds, best):
		merged[BEST_KEY] = candidate_seconds
	merged[CLEAR_COUNT_KEY] = int(previous.get(CLEAR_COUNT_KEY, 0)) + 1
	return merged


## 앱인토스 게임센터는 내림차순만 지원한다. 낮은 기록이 위로 가게 뒤집는다.
##
## 밀리초 정수로 보내는 이유는 세 마켓 중 Play Games Services 와 GameKit 이
## 정수만 받기 때문이다. 세 마켓이 같은 의미의 점수를 갖게 변환을 한 곳에 모은다.
static func to_leaderboard_score(seconds: float) -> int:
	var bounded := clampf(seconds, 0.0, float(MpRules.MAX_DISPLAY_SECONDS + 1))
	return int(round((float(MpRules.MAX_DISPLAY_SECONDS + 1) - bounded) * 1000.0))
