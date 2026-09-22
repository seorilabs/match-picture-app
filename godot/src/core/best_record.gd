class_name MpBestRecord
extends RefCounted
## 개인 최고 기록 판정.
##
## 원본에는 기록 저장이 없었다. 결과 화면의 숫자는 메모리에만 있다가 앱을 끄면 사라졌다.
## 재도전 동기를 만들기 위해 이번에 더한다.

const BEST_KEY := "best_seconds"
const CLEAR_COUNT_KEY := "clear_count"

## 최고 기록을 냈을 때의 라운드별 소요 시간. 플레이 중 페이스 비교에 쓴다.
const BEST_SPLITS_KEY := "best_splits"

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
static func merge(previous: Dictionary, candidate_seconds: float, candidate_splits: Array[float]) -> Dictionary:
	var merged := previous.duplicate(true)
	var best := float(previous.get(BEST_KEY, NO_RECORD))
	# 예전 세이브에는 구간 기록이 없다. 신기록이 아니어도 키는 있어야 호출한 쪽이
	# 그대로 저장할 수 있다.
	merged[BEST_SPLITS_KEY] = splits_from(previous)
	if is_new_best(candidate_seconds, best):
		merged[BEST_KEY] = candidate_seconds
		merged[BEST_SPLITS_KEY] = candidate_splits.duplicate()
	merged[CLEAR_COUNT_KEY] = int(previous.get(CLEAR_COUNT_KEY, 0)) + 1
	return merged


## 세이브에서 구간 기록을 읽는다.
##
## JSON 을 거치면 타입이 풀리고, 구간 기록이 생기기 전 세이브에는 아예 키가 없다.
## 둘 다 "비교할 기록이 없다"로 보고 빈 배열을 돌려준다.
static func splits_from(snapshot: Dictionary) -> Array[float]:
	var result: Array[float] = []
	var raw: Variant = snapshot.get(BEST_SPLITS_KEY, [])
	if not (raw is Array):
		return result
	for value in raw:
		if value is float or value is int:
			result.append(float(value))
	return result


## 구간 기록을 누적 시간표로 바꾼다. i 번째 값은 i + 1 번째 구간까지 걸린 시간이다.
## 플레이 중 "지금 최고 기록보다 몇 초 앞서 있나"를 재는 자다.
static func to_cumulative(splits: Array[float]) -> Array[float]:
	var cumulative: Array[float] = []
	var total := 0.0
	for split in splits:
		total += split
		cumulative.append(total)
	return cumulative


## 앱인토스 게임센터는 내림차순만 지원한다. 낮은 기록이 위로 가게 뒤집는다.
##
## 밀리초 정수로 보내는 이유는 세 마켓 중 Play Games Services 와 GameKit 이
## 정수만 받기 때문이다. 세 마켓이 같은 의미의 점수를 갖게 변환을 한 곳에 모은다.
static func to_leaderboard_score(seconds: float) -> int:
	var bounded := clampf(seconds, 0.0, float(MpRules.MAX_DISPLAY_SECONDS + 1))
	return int(round((float(MpRules.MAX_DISPLAY_SECONDS + 1) - bounded) * 1000.0))
