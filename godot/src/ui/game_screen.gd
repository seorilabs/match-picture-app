class_name MpGameScreen
extends Control
## 게임 화면. HUD 와 카드 두 장을 들고 MpGameState 를 굴린다.
##
## 규칙은 전부 코어에 있다. 여기서는 코어가 알린 것을 그림과 소리로 옮기고,
## 탭을 코어에 넘기는 일만 한다.

signal finished(seconds: float)
## 카드가 놓이는 무대의 화면 좌표. 최초 실행 안내가 같은 자리에 예시 카드를 깔 때 쓴다.
signal stage_rect_changed(rect: Rect2)

## 덱에서 올라온 새 카드가 위 자리로 내려오는 시간.
const SLIDE_IN_SECONDS := 0.15

var _library: MpSymbolLibrary
var _game: MpGameState
var _rng := RandomNumberGenerator.new()

var _hud: MpHud
var _stage: Control
var _opponent_card: MpCardView
var _mine_card: MpCardView
## 판정 마크. 상대·내 카드 각각에 하나씩 두고, 판정된 심볼 위에 겹쳐 띄운다.
## 같은 MpJudgeMark 인스턴스를 재활용하면 흔들림이 서로 간섭하므로 분리했다.
var _opponent_mark: MpJudgeMark
var _mine_mark: MpJudgeMark
var _last_seconds := 0.0
## 최고 기록의 라운드별 누적 시간. 지금 몇 초 앞서 있는지 재는 자다.
## 기록이 없으면 비어 있고, 그때는 페이스를 표시하지 않는다.
var _best_cumulative: Array[float] = []

var _slide_tween: Tween


func _init(library: MpSymbolLibrary) -> void:
	_library = library
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_IGNORE

	# 무대는 HUD 높이만큼 비우고 시작한다. 카드 배율과 자리를 재는 기준이 이 크기라,
	# 여기를 건드리면 카드가 커지거나 작아진다.
	_stage = Control.new()
	_stage.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_stage.offset_top = MpRules.HUD_HEIGHT
	_stage.clip_contents = false
	_stage.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(_stage)

	_opponent_card = MpCardView.new()
	_opponent_card.set_interactive(false)
	_stage.add_child(_opponent_card)

	_mine_card = MpCardView.new()
	_mine_card.set_interactive(true)
	_mine_card.symbol_pressed.connect(_on_symbol_pressed)
	_stage.add_child(_mine_card)

	_opponent_mark = MpJudgeMark.new()
	_stage.add_child(_opponent_mark)
	_mine_mark = MpJudgeMark.new()
	_stage.add_child(_mine_mark)

	# HUD 는 카드보다 뒤에 붙어야 위에 그려진다. 새 카드가 위에서 미끄러져 들어올 때
	# 그 자리를 지나가는데, 그동안 남은 카드 수와 초가 가려지면 안 된다.
	_hud = MpHud.new()
	_hud.set_anchors_and_offsets_preset(Control.PRESET_TOP_WIDE)
	_hud.offset_bottom = MpRules.HUD_HEIGHT
	add_child(_hud)

	_stage.resized.connect(_on_stage_resized)


## 결과 화면과 공유 문구가 쓰는 마지막 기록.
func last_seconds() -> float:
	return _last_seconds


func wrong_count() -> int:
	return _game.wrong_count() if _game != null else 0


## 방금 판의 라운드별 소요 시간. 결과 화면과 기록 저장이 쓴다.
func splits() -> Array[float]:
	return _game.splits() if _game != null else []


## 판을 시작하기 전에 조립 루트가 넣어 준다. 세이브는 여기서 읽지 않는다.
func set_best_record(best_seconds: float, best_splits: Array[float]) -> void:
	_hud.set_best_seconds(best_seconds)
	_best_cumulative = MpBestRecord.to_cumulative(best_splits)


func start_new_game() -> void:
	_kill_slide()
	_rng.randomize()
	_game = MpGameState.new()
	_game.round_started.connect(_on_round_started)
	_game.judged.connect(_on_judged)
	_game.hint_started.connect(_on_hint_started)
	_game.finished.connect(_on_finished)
	_game.start(_rng)
	_hud.set_seconds(0.0)
	_hud.set_deck_label(_game.deck_label())


func _process(delta: float) -> void:
	if _game == null:
		return
	_game.advance(delta)
	_hud.set_seconds(_game.elapsed_seconds())


## 카드가 놓이는 무대의 화면 좌표. 안내 오버레이가 여기에 예시 카드를 맞춘다.
func stage_rect() -> Rect2:
	return Rect2(_stage.global_position, _stage.size)


func _layout_cards() -> void:
	var stage := _stage.size
	if stage.x <= 0.0 or stage.y <= 0.0:
		return

	var layout := MpCardLayout.compute(stage)
	for card in [_opponent_card, _mine_card]:
		card.scale = Vector2(layout.factor, layout.factor)
	_opponent_card.position = layout.opponent_position
	_mine_card.position = layout.mine_position

	# HUD 를 상단 카드 바로 위에 붙인다. 화면 맨 위에 고정해 두면 앱인토스처럼 게임이
	# 상태 표시줄 아래까지 그려지는 표면에서 숫자가 그 밑으로 들어가 읽히지 않는다.
	# 카드를 세로 가운데로 맞추고 남는 위쪽 여유만큼 HUD 가 함께 내려온다.
	_hud.position.y = maxf(0.0, _stage.position.y + layout.opponent_position.y - MpRules.HUD_HEIGHT)

	# O/X 마크는 심볼을 따라다니므로 여기서 자를 잡아 줄 필요가 없다.

	stage_rect_changed.emit(stage_rect())


## 안전영역이나 창 크기가 바뀌면 카드가 통째로 움직인다. 움직이던 카드를 제자리에
## 앉히고 다시 잰다. 판정 마크는 심볼을 따라다니므로 따로 손대지 않는다.
func _on_stage_resized() -> void:
	_kill_slide()
	_layout_cards()


## 정답을 맞히면 상대 카드가 내 자리로 내려오고 내 카드는 아래로 빠진다.
##
## 원본의 진행 규칙이 "위에 있던 카드가 아래로 내려오고 덱에서 새 카드를 위에 올린다"
## 인데(MpRound), 지금까지 화면에서는 순간 교체라 보이지 않았다.
##
## 노드는 자리에 고정이고 움직이는 것은 위치와 내용이다. 다음 라운드의 내 카드가 곧
## 지금 상대 카드라, 라운드가 바뀌며 내려온 그림이 아래 자리에 그대로 들어간다.
##
## 연출은 반드시 정답 펄스 시간 안에서 끝낸다. 그동안은 코어가 이미 입력을 잠가 두므로
## 판 시간도 입력 잠금 구간도 달라지지 않는다. 연출 때문에 잠금을 늘리면 그것은
## 규칙 변경이고 기록의 의미가 바뀐다.
func _slide_cards_down() -> void:
	_kill_slide()
	if _stage.size.y <= 0.0:
		return
	var layout := MpCardLayout.compute(_stage.size)
	_slide_tween = create_tween().set_parallel(true)
	_slide_tween.set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_IN_OUT)
	_slide_tween.tween_property(
		_opponent_card, "position", layout.mine_position, MpRules.CORRECT_PULSE_SECONDS)
	_slide_tween.tween_property(
		_mine_card, "position", Vector2(layout.mine_position.x, _stage.size.y),
		MpRules.CORRECT_PULSE_SECONDS)


## 덱에서 올라온 새 카드를 위에서 내려보낸다.
##
## 이쪽은 입력 잠금 밖이라 짧게 끝낸다. 위 카드를 빨리 읽어야 다음 정답을 찾는데,
## 오래 움직이면 그만큼 초시계만 흐른다.
func _slide_in_opponent() -> void:
	if _stage.size.y <= 0.0:
		return
	var layout := MpCardLayout.compute(_stage.size)
	var target := layout.opponent_position
	_opponent_card.position = Vector2(target.x, -MpRules.CARD_SIZE * layout.factor)
	_slide_tween = create_tween()
	_slide_tween.set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
	_slide_tween.tween_property(_opponent_card, "position", target, SLIDE_IN_SECONDS)


## 트윈이 살아 있으면 위치를 물고 있다. 자리를 다시 잡기 전에 끊는다.
func _kill_slide() -> void:
	if _slide_tween != null and _slide_tween.is_valid():
		_slide_tween.kill()
	_slide_tween = null


func _on_round_started(next_round: MpRound) -> void:
	_update_pace()
	# 내려간 카드를 제자리로 되돌리고 내용을 새로 채운다. 노드는 자리에 고정이다.
	# 원본도 패널 두 개가 고정이었고 회전 누적이 카드가 아니라 자리를 따라갔다.
	_kill_slide()
	_opponent_mark.dismiss()
	_mine_mark.dismiss()
	_opponent_card.show_card(next_round.opponent, MpPlacement.build(_rng, _opponent_card.current_rotations()), _library)
	_mine_card.show_card(next_round.mine, MpPlacement.build(_rng, _mine_card.current_rotations()), _library)
	_mine_card.set_interactive(true)
	_hud.set_deck_label(_game.deck_label())
	_layout_cards()
	_slide_in_opponent()


func _on_symbol_pressed(symbol: String) -> void:
	if _game == null:
		return
	_game.judge(symbol)


func _on_judged(symbol: String, correct: bool) -> void:
	# 판정 연출이 도는 동안에는 탭을 받지 않는다. 원본도 버튼 8개를 통째로 껐다.
	_mine_card.set_interactive(false)
	_mine_card.stop_hints()

	if correct:
		Audio.play_correct()
		_mine_card.pulse_symbol(symbol)
		_slide_cards_down()
		# 위·아래 카드 양쪽의 같은 심볼에 O 를 씌운다.
		_opponent_mark.show_on_symbol(
			_opponent_card.find_symbol(symbol),
			"O", MpUiKit.CORRECT,
			MpRules.CORRECT_PULSE_SECONDS, false)
		_mine_mark.show_on_symbol(
			_mine_card.find_symbol(symbol),
			"O", MpUiKit.CORRECT,
			MpRules.CORRECT_PULSE_SECONDS, false)
	else:
		Audio.play_wrong()
		# 오답은 아래(플레이어) 카드에서 누른 심볼에만 X 를 긋는다.
		# 상대 카드는 정답도 아니고 사용자가 누른 곳도 아니므로 비워 둔다.
		_opponent_mark.dismiss()
		_mine_mark.show_on_symbol(
			_mine_card.find_symbol(symbol),
			"X", MpUiKit.WRONG,
			MpRules.WRONG_PENALTY_SECONDS, true)
		# 오답은 같은 문제가 유지되므로 잠금이 풀리면 다시 받는다.
		get_tree().create_timer(MpRules.WRONG_PENALTY_SECONDS).timeout.connect(_restore_input)


func _restore_input() -> void:
	if _game == null or _game.state() == MpGameState.State.FINISHED:
		return
	_mine_card.set_interactive(true)
	if _game.hint_active() and _game.current_round() != null:
		_mine_card.start_hint(_game.current_round().hint)


func _on_hint_started() -> void:
	if _game == null or _game.current_round() == null:
		return
	_mine_card.start_hint(_game.current_round().hint)


## 최고 기록의 같은 지점과 견준 차이를 HUD 에 잠깐 띄운다.
##
## 라운드가 끝날 때마다 부른다. 초시계가 첫 정답 뒤에 켜지므로 1라운드에는 잴 것이
## 없고, 최고 기록보다 판이 길어지면(구간 수가 모자라면) 비교를 멈춘다.
func _update_pace() -> void:
	if _game == null or _best_cumulative.is_empty():
		return
	var done := _game.splits().size()
	if done <= 0 or done > _best_cumulative.size():
		return
	_hud.show_pace(_game.elapsed_seconds() - _best_cumulative[done - 1])


func _on_finished(seconds: float) -> void:
	_update_pace()
	_last_seconds = seconds
	_mine_card.set_interactive(false)
	_mine_card.stop_hints()
	_hud.set_deck_label(_game.deck_label())
	_hud.set_seconds(seconds)
	finished.emit(seconds)
