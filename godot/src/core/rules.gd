class_name MpRules
extends RefCounted
## 게임 규칙 상수 정본.
##
## 값의 출처는 원본 Unity 프로젝트다. 바꾸기 전에 원본이 왜 그 값이었는지 확인한다.
## 원본: seoleeapps/MatchPictureUnity — Assets/Scripts/GameSceneManager.cs,
## Assets/Scripts/UI/UIButtonSymbol.cs

## 한 카드에 그려지는 심볼 수. 사영평면 차수 p 에서 p + 1 이다.
const SYMBOLS_PER_CARD := 8

## 한 판에서 플레이어가 맞혀야 하는 정답 수.
##
## 덱은 이보다 한 장 많은 11장이 만들어진다. 원본 Deck.cs 의
## `RemoveRange(numberOfCards + 1, ...)` off-by-one 이 그렇게 만들었고, 화면에 먼저
## 깔리는 상대 카드 1장 + 플레이 10회가 되어 UI 의 "10" 표기와 맞아떨어졌다.
## 이것을 "버그"로 보고 10장으로 고치면 한 판이 9문제로 줄어든다. 고치지 않는다.
const TOTAL_CARDS := 10

## 사영평면 차수. 심볼 풀 크기는 p^2 + p + 1 = 57 이 된다.
const PRIME := 7

## 심볼 풀 크기. assets/symbols/001.png ~ 057.png 와 개수가 같아야 한다.
const SYMBOL_POOL_SIZE := PRIME * PRIME + PRIME + 1

## 타이머 표시 상한. 원본은 999 를 넘으면 "999s" 로 고정했다.
const MAX_DISPLAY_SECONDS := 999

## 라운드가 시작되고 이만큼 지나면 정답 심볼이 흔들리기 시작한다.
const HINT_DELAY_SECONDS := 10.0

## 힌트 흔들림이 이어지는 시간. 정답을 맞힐 때까지 약 10.5초 주기로 반복된다.
const HINT_SHAKE_SECONDS := 0.5

## 오답을 눌렀을 때 입력이 잠기는 시간. 타이머는 이 동안에도 계속 흐른다.
const WRONG_PENALTY_SECONDS := 1.5

## 정답 펄스가 이어지는 시간. 이 동안에도 입력이 잠긴다.
##
## 원본은 프레임마다 scale 을 0.1 씩 더해 1 → 2 → 1 로 돌렸다. 60fps 기준 약 0.333초인데
## 프레임레이트에 매여 있어 120Hz 기기에서는 두 배로 빨라진다. 시간 기반으로 옮긴다.
const CORRECT_PULSE_SECONDS := 0.3333
const CORRECT_PULSE_SCALE := 2.0

## 카드 한 장의 좌표계 크기. 화면 크기와 무관하게 이 안에서 심볼을 배치한다.
const CARD_SIZE := 650.0

## 심볼 버튼 한 변의 길이.
const SYMBOL_SIZE := 100.0

## 상단 HUD 높이.
const HUD_HEIGHT := 100.0

## 카드를 그릴 때 곱하는 기본 배율. 원본 VerticalLayoutGroup 의 localScale 이다.
const CARD_RENDER_SCALE := 0.9


## 타이머 표시 문자열. 원본은 소수점을 버리고 999 에서 고정했다.
static func format_seconds(seconds: float) -> String:
	var truncated := int(floor(seconds))
	if truncated > MAX_DISPLAY_SECONDS:
		return "%ds" % MAX_DISPLAY_SECONDS
	if truncated < 0:
		return "0s"
	return "%ds" % truncated
