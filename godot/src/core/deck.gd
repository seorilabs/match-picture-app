class_name MpDeck
extends RefCounted
## 유한 사영평면으로 도블 덱을 만든다.
##
## 원본 Unity `Assets/Scripts/Deck.cs` 의 절차를 그대로 옮겼다. 차수 p 의 사영평면이라
## 임의의 두 카드는 정확히 한 개의 심볼을 공유한다. 정답 유일성이 수학적으로 보장되므로
## 런타임에 정답이 여러 개이거나 없는 경우를 따로 방어할 필요가 없다.


## Unity 의 string.Format("{0,3:d3}", i) 와 같은 3자리 0 패딩이다.
static func symbol_name(index: int) -> String:
	return "%03d" % index


## 덱을 만든다. max_cards 를 주면 원본과 같이 max_cards + 1 장이 남는다.
##
## rng 를 주입받는 이유는 테스트가 같은 덱을 재현할 수 있게 하기 위해서다.
static func build(prime: int, max_cards: int, rng: RandomNumberGenerator) -> Array[PackedStringArray]:
	var cards: Array[PackedStringArray] = []
	if prime <= 1:
		push_error("prime 은 1보다 큰 정수여야 한다. 받은 값: %d" % prime)
		return cards

	# 첫 묶음. p + 1 장이 모두 001 을 공통 심볼로 가진다.
	for i in prime + 1:
		var card := PackedStringArray([symbol_name(1)])
		for j in prime:
			card.append(symbol_name(j + 1 + i * prime + 1))
		_shuffle_strings(card, rng)
		cards.append(card)

	# 두 번째 묶음. p * p 장이 정해진 산술식으로 채워진다.
	for k in range(2, prime + 2):
		for i in prime:
			var card := PackedStringArray([symbol_name(k)])
			for j in prime:
				var val := prime + 2 + i + (k + prime) * j
				while val >= prime + 2 + (j + 1) * prime:
					val -= prime
				card.append(symbol_name(val))
			_shuffle_strings(card, rng)
			cards.append(card)

	_shuffle_cards(cards, rng)

	if max_cards > 0 and cards.size() > max_cards:
		# 원본: cards.RemoveRange(numberOfCards + 1, cards.Count - numberOfCards - 1)
		# 결과적으로 max_cards + 1 장이 남는다. MpRules.TOTAL_CARDS 주석 참고.
		cards.resize(max_cards + 1)

	return cards


## 두 카드의 공통 심볼. 사영평면 보장상 정확히 하나다. 없으면 빈 문자열.
static func find_common_symbol(a: PackedStringArray, b: PackedStringArray) -> String:
	for symbol in b:
		if a.has(symbol):
			return symbol
	return ""


## 원본 ShuffleList 와 같은 셔플.
##
## `i > 1` 에서 멈춰 인덱스 0 과 1 이 서로 자리를 바꾸지 않는다. 정석 Fisher-Yates 는
## `i > 0` 이다. 카드에 랜덤 회전과 배율이 따로 걸리므로 화면에서는 차이가 보이지 않고,
## 원본 충실이 이번 재구현의 방침이라 quirk 를 그대로 둔다.
static func _shuffle_strings(list: PackedStringArray, rng: RandomNumberGenerator) -> void:
	var i := list.size() - 1
	while i > 1:
		var pick := rng.randi_range(0, i)
		var value := list[pick]
		list[pick] = list[i]
		list[i] = value
		i -= 1


static func _shuffle_cards(list: Array[PackedStringArray], rng: RandomNumberGenerator) -> void:
	var i := list.size() - 1
	while i > 1:
		var pick := rng.randi_range(0, i)
		var value := list[pick]
		list[pick] = list[i]
		list[i] = value
		i -= 1
