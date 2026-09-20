extends Node
## 순수 로직 게이트. 게임 조립도, 화면도, 어댑터도 보지 않는다.
##
## 실행: godot --headless --path godot tests/core_test_runner.tscn
##
## 스모크(tests/test_runner.gd)와 역할을 나눈 이유는 실패를 읽을 수 있게 하기 위해서다.
## 덱 규칙이 깨졌을 때 화면이나 어댑터 실패에 섞이면 원인을 로그에서 갈라내야 한다.
## 여기서는 autoload 를 한 번도 건드리지 않는다. 조립이 망가진 상태에서도
## 이 게이트는 코어 규칙의 결과를 그대로 보고해야 한다.

const STEP := 1.0 / 60.0
const SEED := 20200820

var _failures: Array[String] = []
var _checks := 0


func _ready() -> void:
	print("[core-test] 시작")

	print("[core-test] > _test_rules")
	_test_rules()
	print("[core-test] > _test_deck")
	_test_deck()
	print("[core-test] > _test_round")
	_test_round()
	print("[core-test] > _test_placement")
	_test_placement()
	print("[core-test] > _test_game_flow")
	_test_game_flow()
	print("[core-test] > _test_timer_semantics")
	_test_timer_semantics()
	print("[core-test] > _test_best_record")
	_test_best_record()
	print("[core-test] > _test_analytics_contract")
	_test_analytics_contract()

	print("[core-test] 검사 %d건, 실패 %d건" % [_checks, _failures.size()])
	for failure in _failures:
		printerr("[core-test] 실패: %s" % failure)
	get_tree().quit(1 if not _failures.is_empty() else 0)


func _test_rules() -> void:
	check_eq(MpRules.SYMBOL_POOL_SIZE, 57, "심볼 풀이 57종이다")
	check_eq(MpRules.SYMBOLS_PER_CARD, MpRules.PRIME + 1, "카드당 심볼이 p + 1 이다")
	check_eq(MpRules.format_seconds(0.0), "0s", "0초 표시")
	check_eq(MpRules.format_seconds(23.9), "23s", "소수점은 버린다")
	check_eq(MpRules.format_seconds(1000.4), "999s", "999초를 넘으면 고정한다")
	check_eq(MpRules.format_seconds(-1.0), "0s", "음수는 0으로 막는다")


func _test_deck() -> void:
	var rng := _rng()

	# 자르지 않으면 p^2 + p + 1 장이 나온다.
	var full := MpDeck.build(MpRules.PRIME, 0, rng)
	check_eq(full.size(), 57, "자르지 않은 덱은 57장이다")

	var deck := MpDeck.build(MpRules.PRIME, MpRules.TOTAL_CARDS, _rng())
	# 원본 off-by-one 이 만든 11장. 이것이 한 판 10문제의 근거다.
	check_eq(deck.size(), MpRules.TOTAL_CARDS + 1, "게임용 덱은 11장이다")

	var sizes_ok := true
	var ids_ok := true
	var unique_ok := true
	for card in deck:
		if card.size() != MpRules.SYMBOLS_PER_CARD:
			sizes_ok = false
		var seen := {}
		for symbol in card:
			var index := int(symbol)
			if index < 1 or index > MpRules.SYMBOL_POOL_SIZE or symbol.length() != 3:
				ids_ok = false
			if seen.has(symbol):
				unique_ok = false
			seen[symbol] = true
	check(sizes_ok, "모든 카드에 심볼이 8개다")
	check(ids_ok, "심볼 ID 가 001~057 범위의 3자리다")
	check(unique_ok, "한 카드 안에 같은 심볼이 두 번 나오지 않는다")

	# 도블의 핵심. 어느 두 장을 뽑아도 공통 심볼이 정확히 하나여야 정답이 유일하다.
	var pairs := 0
	var every_pair_has_one := true
	for i in deck.size():
		for j in range(i + 1, deck.size()):
			pairs += 1
			var shared := 0
			for symbol in deck[i]:
				if deck[j].has(symbol):
					shared += 1
			if shared != 1:
				every_pair_has_one = false
	check_eq(pairs, 55, "11장에서 만들어지는 짝은 55개다")
	check(every_pair_has_one, "임의의 두 카드는 공통 심볼이 정확히 하나다")

	# 57장 전체에서도 성립해야 한다. 잘라낸 11장만 우연히 맞는 것이 아님을 확인한다.
	var full_pairs_ok := true
	for i in full.size():
		for j in range(i + 1, full.size()):
			var shared := 0
			for symbol in full[i]:
				if full[j].has(symbol):
					shared += 1
			if shared != 1:
				full_pairs_ok = false
	check(full_pairs_ok, "57장 전체에서도 두 카드의 공통 심볼이 하나다")

	check_eq(MpDeck.symbol_name(1), "001", "심볼 이름은 3자리 0 패딩이다")
	check_eq(MpDeck.symbol_name(57), "057", "심볼 이름 상한")
	check_eq(
		MpDeck.find_common_symbol(PackedStringArray(["001", "002"]), PackedStringArray(["003", "002"])),
		"002",
		"공통 심볼을 찾는다"
	)
	check_eq(
		MpDeck.find_common_symbol(PackedStringArray(["001"]), PackedStringArray(["002"])),
		"",
		"공통 심볼이 없으면 빈 문자열이다"
	)


func _test_round() -> void:
	var deck := MpDeck.build(MpRules.PRIME, MpRules.TOTAL_CARDS, _rng())
	var queue := deck.duplicate()

	var first := MpRound.take_next(queue, PackedStringArray())
	check(first != null, "첫 라운드를 꺼낸다")
	check_eq(queue.size(), MpRules.TOTAL_CARDS - 1, "첫 라운드가 두 장을 쓴다")
	check(first.mine.has(first.hint), "정답 심볼이 내 카드에 있다")
	check(first.opponent.has(first.hint), "정답 심볼이 상대 카드에도 있다")

	# 위에 있던 카드가 아래로 내려오는 것이 원본의 진행 규칙이다.
	var previous_opponent := first.opponent
	var second := MpRound.take_next(queue, previous_opponent)
	check(second != null, "두 번째 라운드를 꺼낸다")
	check_eq(second.mine, previous_opponent, "직전 상대 카드가 내 카드가 된다")
	check_eq(queue.size(), MpRules.TOTAL_CARDS - 2, "이후 라운드는 한 장씩 쓴다")


func _test_placement() -> void:
	check_eq(MpPlacement.ANCHORS.size(), MpRules.SYMBOLS_PER_CARD, "앵커가 심볼 수와 같다")

	var inside := true
	var half := MpRules.CARD_SIZE / 2.0
	for anchor in MpPlacement.ANCHORS:
		if absf(anchor.x) > half or absf(anchor.y) > half:
			inside = false
	check(inside, "앵커가 카드 좌표계 안에 있다")

	var rng := _rng()
	var spots := MpPlacement.build(rng)
	check_eq(spots.size(), MpRules.SYMBOLS_PER_CARD, "배치를 심볼 수만큼 만든다")

	var scales_ok := true
	for spot in spots:
		if spot.scale < MpPlacement.MIN_SYMBOL_SCALE or spot.scale > MpPlacement.MAX_SYMBOL_SCALE:
			scales_ok = false
	check(scales_ok, "배율이 0.8~1.5 범위다")

	# 원본 Rotate 는 기존 각도에 더하는 누적이었다.
	var previous := PackedFloat32Array([1000.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0])
	var accumulated := MpPlacement.build(_rng(), previous)
	check(
		absf(accumulated[0].rotation_degrees - 1000.0) <= MpPlacement.ROTATION_RANGE_DEGREES,
		"회전이 직전 각도에 누적된다"
	)


func _test_game_flow() -> void:
	var game := MpGameState.new()
	check_eq(game.state(), MpGameState.State.IDLE, "시작 전에는 IDLE 이다")

	check(game.start(_rng()), "한 판을 시작한다")
	check_eq(game.state(), MpGameState.State.PLAYING, "시작하면 PLAYING 이다")
	check_eq(game.deck_label(), "10", "시작 표시는 10이다")

	var labels: Array[String] = []
	var guard := 0
	while game.state() != MpGameState.State.FINISHED and guard < 100000:
		guard += 1
		if game.accepts_input():
			labels.append(game.deck_label())
			game.judge(game.current_round().hint)
		game.advance(STEP)

	check(game.state() == MpGameState.State.FINISHED, "정답만 누르면 판이 끝난다")
	check_eq(game.correct_count(), MpRules.TOTAL_CARDS, "정답 10회로 끝난다")
	check_eq(game.wrong_count(), 0, "정답만 눌렀으므로 오답이 0이다")
	check_eq(game.deck_label(), "0", "끝나면 표시가 0이다")
	check_eq(labels, ["10", "9", "8", "7", "6", "5", "4", "3", "2", "1"] as Array[String], "표시가 10에서 1까지 줄어든다")


func _test_timer_semantics() -> void:
	var game := MpGameState.new()
	game.start(_rng())

	# 첫 정답을 맞히기 전에는 아무리 기다려도 초시계가 돌지 않는다.
	# 11초분을 흘려 힌트 기준(10초)도 함께 넘긴다.
	for i in 660:
		game.advance(STEP)
	check_eq(game.elapsed_seconds(), 0.0, "첫 정답 전에는 타이머가 멈춰 있다")

	# 힌트는 그 동안에도 흐른다. 10초를 넘겼으니 이미 켜져 있어야 한다.
	check(game.hint_active(), "라운드 시작 10초 뒤 힌트가 켜진다")

	# 오답은 입력을 잠그고, 같은 문제가 유지된다.
	var before_round := game.current_round()
	var wrong_symbol := ""
	for symbol in before_round.mine:
		if symbol != before_round.hint:
			wrong_symbol = symbol
			break
	game.judge(wrong_symbol)
	check_eq(game.state(), MpGameState.State.PENALTY, "오답이면 PENALTY 로 간다")
	check(not game.accepts_input(), "오답 잠금 중에는 탭을 받지 않는다")
	game.advance(STEP)
	check_eq(game.elapsed_seconds(), 0.0, "첫 정답 전이라 오답 중에도 타이머가 멈춰 있다")

	# 잠금이 풀리면 같은 문제로 돌아온다.
	for i in 120:
		game.advance(STEP)
	check_eq(game.state(), MpGameState.State.PLAYING, "오답 잠금이 풀린다")
	check_eq(game.current_round(), before_round, "오답은 같은 문제를 유지한다")
	check_eq(game.wrong_count(), 1, "오답 수를 센다")

	# 첫 정답. 펄스가 끝나기 전까지는 아직 타이머가 돌지 않는다.
	game.judge(game.current_round().hint)
	check_eq(game.state(), MpGameState.State.PULSING, "정답이면 PULSING 으로 간다")
	game.advance(STEP)
	check_eq(game.elapsed_seconds(), 0.0, "정답 펄스가 끝나기 전에는 타이머가 멈춰 있다")

	for i in 60:
		game.advance(STEP)
	check(game.elapsed_seconds() > 0.0, "첫 정답 펄스가 끝나면 타이머가 흐른다")

	# 두 번째 문제에서 오답을 내면, 이제는 타이머가 흐르는 중이므로 시간이 손해로 쌓인다.
	var running := game.elapsed_seconds()
	var round_two := game.current_round()
	var wrong_two := ""
	for symbol in round_two.mine:
		if symbol != round_two.hint:
			wrong_two = symbol
			break
	game.judge(wrong_two)
	for i in 30:
		game.advance(STEP)
	check(game.elapsed_seconds() > running, "오답 잠금 중에도 타이머는 계속 흐른다")


func _test_best_record() -> void:
	check(not MpBestRecord.has_record(MpBestRecord.NO_RECORD), "0은 기록 없음을 뜻한다")
	check(MpBestRecord.is_new_best(30.0, MpBestRecord.NO_RECORD), "첫 기록은 언제나 신기록이다")
	check(MpBestRecord.is_new_best(22.5, 23.0), "더 짧으면 신기록이다")
	check(not MpBestRecord.is_new_best(23.5, 23.0), "더 길면 신기록이 아니다")
	check(not MpBestRecord.is_new_best(23.0, 23.0), "같으면 신기록이 아니다")
	# 표시용으로 정수로 깎으면 23.9와 23.1이 같은 기록이 된다. 실수 그대로 판정한다.
	check(MpBestRecord.is_new_best(23.1, 23.9), "소수점 차이도 신기록으로 잡는다")

	var merged := MpBestRecord.merge({"best_seconds": 30.0, "clear_count": 2}, 25.0)
	check_eq(merged["best_seconds"], 25.0, "신기록이면 갱신한다")
	check_eq(merged["clear_count"], 3, "클리어 수를 센다")
	var kept := MpBestRecord.merge({"best_seconds": 20.0, "clear_count": 1}, 25.0)
	check_eq(kept["best_seconds"], 20.0, "신기록이 아니면 기존 기록을 지킨다")
	check_eq(kept["clear_count"], 2, "신기록이 아니어도 클리어 수는 센다")

	# 앱인토스 게임센터가 내림차순만 지원해서 뒤집어 보낸다. 짧은 기록이 큰 점수다.
	var fast := MpBestRecord.to_leaderboard_score(20.0)
	var slow := MpBestRecord.to_leaderboard_score(40.0)
	check(fast > slow, "짧은 기록이 더 높은 점수가 된다")
	check_eq(fast, 980000, "20초는 980000점이다")
	check(MpBestRecord.to_leaderboard_score(2000.0) >= 0, "표시 상한을 넘겨도 점수가 음수가 되지 않는다")


func _test_analytics_contract() -> void:
	# 이름을 바꾸면 그때부터 쌓인 GA4 리포트가 조용히 끊긴다. 웹 구현에서 쓰던 이름을
	# 그대로 승계했는지 못으로 박아 둔다.
	check_eq(MpAnalyticsEvents.GAME_OPEN, "game_open", "game_open 이름 유지")
	check_eq(MpAnalyticsEvents.LEVEL_START, "level_start", "level_start 이름 유지")
	check_eq(MpAnalyticsEvents.LEVEL_END, "level_end", "level_end 이름 유지")
	# GA4 앱 스트림의 예약어 ad_impression 을 피한 이름이다. 되돌리면 이벤트가 먹힌다.
	check_eq(
		MpAnalyticsEvents.INTERSTITIAL_AD_IMPRESSION,
		"interstitial_ad_impression",
		"전면광고 이벤트가 GA4 예약어를 피한 이름을 유지한다"
	)

	var names: Array[String] = []
	var lengths_ok := true
	var charset_ok := true
	for name in MpAnalyticsEvents.ALLOWED_PARAMS:
		names.append(name)
		# GA4 이벤트 이름은 40자 이내, 영숫자와 밑줄만 쓴다.
		if String(name).length() > 40:
			lengths_ok = false
		if not String(name).is_valid_identifier():
			charset_ok = false
	check(names.size() >= 11, "계약에 이벤트가 11개 이상 있다")
	check(lengths_ok, "모든 이벤트 이름이 GA4 상한 40자 안에 있다")
	check(charset_ok, "모든 이벤트 이름이 영숫자와 밑줄만 쓴다")

	check(MpAnalyticsEvents.is_known("level_end"), "계약에 있는 이름을 안다")
	check(not MpAnalyticsEvents.is_known("made_up_event"), "계약에 없는 이름은 모른다")

	# 계약 밖 키는 걸러진다. 오타 하나로 GA4 에 쓰레기 차원이 생기면 되돌리기 어렵다.
	var cleaned := MpAnalyticsEvents.sanitize(
		MpAnalyticsEvents.LEVEL_END,
		{"seconds": 23, "wrong_count": 1, "oops_typo": "x"}
	)
	check(cleaned.has("seconds") and cleaned.has("wrong_count"), "허용된 키는 남는다")
	check(not cleaned.has("oops_typo"), "계약에 없는 키는 걸러진다")
	check_eq(MpAnalyticsEvents.sanitize("made_up_event", {"a": 1}).size(), 0, "모르는 이벤트는 전부 걸러진다")


func _rng() -> RandomNumberGenerator:
	var rng := RandomNumberGenerator.new()
	rng.seed = SEED
	return rng


func check(condition: bool, label: String) -> void:
	_checks += 1
	if not condition:
		_failures.append(label)


func check_eq(actual: Variant, expected: Variant, label: String) -> void:
	_checks += 1
	if actual != expected:
		_failures.append("%s — 기대 %s, 실제 %s" % [label, expected, actual])
