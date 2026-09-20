class_name MpRound
extends RefCounted
## 한 라운드의 두 카드와 정답 심볼.
##
## 원본의 진행 규칙은 "위에 있던 카드가 아래로 내려오고 덱에서 새 카드를 위에 올린다"이다.
## 그래서 매 라운드 내 카드는 직전 상대 카드가 되고, 덱은 한 장씩 줄어든다.

var opponent: PackedStringArray
var mine: PackedStringArray
var hint: String


func _init(p_opponent: PackedStringArray, p_mine: PackedStringArray, p_hint: String) -> void:
	opponent = p_opponent
	mine = p_mine
	hint = p_hint


## 큐에서 다음 라운드를 꺼낸다. 큐를 직접 줄이므로 호출한 쪽은 복사본을 넘긴다.
##
## previous_opponent 가 비어 있으면 첫 라운드로 보고 두 장을 꺼낸다.
## 더 진행할 수 없으면 null 을 돌려준다.
static func take_next(queue: Array[PackedStringArray], previous_opponent: PackedStringArray) -> MpRound:
	if previous_opponent.is_empty():
		if queue.size() < 2:
			return null
		var first_opponent: PackedStringArray = queue.pop_front()
		var first_mine: PackedStringArray = queue.pop_front()
		return _make(first_opponent, first_mine)

	if queue.is_empty():
		return null
	var next_opponent: PackedStringArray = queue.pop_front()
	return _make(next_opponent, previous_opponent)


static func _make(opponent: PackedStringArray, mine: PackedStringArray) -> MpRound:
	var common := MpDeck.find_common_symbol(opponent, mine)
	if common.is_empty():
		push_error("두 카드 사이에 공통 심볼이 없다. 덱 생성이 잘못됐다.")
		return null
	return MpRound.new(opponent, mine, common)
