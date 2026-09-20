class_name MpGameScreen
extends Control
## 게임 화면. HUD 와 카드 두 장을 들고 MpGameState 를 굴린다.
##
## 규칙은 전부 코어에 있다. 여기서는 코어가 알린 것을 그림과 소리로 옮기고,
## 탭을 코어에 넘기는 일만 한다.

signal finished(seconds: float)

var _library: MpSymbolLibrary
var _game: MpGameState
var _rng := RandomNumberGenerator.new()

var _hud: MpHud
var _stage: Control
var _opponent_card: MpCardView
var _mine_card: MpCardView
var _judge_mark: MpJudgeMark


func _init(library: MpSymbolLibrary) -> void:
	_library = library
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_IGNORE

	var column := VBoxContainer.new()
	column.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	column.add_theme_constant_override("separation", 0)
	column.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(column)

	_hud = MpHud.new()
	column.add_child(_hud)

	_stage = Control.new()
	_stage.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_stage.clip_contents = false
	_stage.mouse_filter = Control.MOUSE_FILTER_IGNORE
	column.add_child(_stage)

	_opponent_card = MpCardView.new()
	_opponent_card.set_interactive(false)
	_stage.add_child(_opponent_card)

	_mine_card = MpCardView.new()
	_mine_card.set_interactive(true)
	_mine_card.symbol_pressed.connect(_on_symbol_pressed)
	_stage.add_child(_mine_card)

	_judge_mark = MpJudgeMark.new()
	_stage.add_child(_judge_mark)

	_stage.resized.connect(_layout_cards)


func start_new_game() -> void:
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


## 원본 CanvasScaler 를 재현한 뷰포트에서는 평소 0.9 가 그대로 나오고,
## 화면이 유난히 좁거나 낮을 때만 더 줄어든다.
func _layout_cards() -> void:
	var stage := _stage.size
	if stage.x <= 0.0 or stage.y <= 0.0:
		return

	var by_width := (stage.x - MpRules.CARD_SIDE_MARGIN * 2.0) / MpRules.CARD_SIZE
	var by_height := (stage.y - MpRules.CARD_GAP) / (MpRules.CARD_SIZE * 2.0)
	var factor := minf(MpRules.CARD_RENDER_SCALE, minf(by_width, by_height))
	factor = maxf(factor, 0.1)

	var drawn := MpRules.CARD_SIZE * factor
	var left := (stage.x - drawn) / 2.0
	var free_height := stage.y - drawn * 2.0
	var gap := clampf(free_height, 0.0, MpRules.CARD_GAP)
	var top := (stage.y - drawn * 2.0 - gap) / 2.0

	for card in [_opponent_card, _mine_card]:
		card.scale = Vector2(factor, factor)

	_opponent_card.position = Vector2(left, top)
	_mine_card.position = Vector2(left, top + drawn + gap)

	# O/X 는 내 카드 위 한가운데에 띄운다. 원본도 PanelMine 아래에 있었다.
	_judge_mark.position = _mine_card.position
	_judge_mark.size = Vector2(drawn, drawn)


func _on_round_started(next_round: MpRound) -> void:
	_opponent_card.show_card(next_round.opponent, MpPlacement.build(_rng, _opponent_card.current_rotations()), _library)
	_mine_card.show_card(next_round.mine, MpPlacement.build(_rng, _mine_card.current_rotations()), _library)
	_mine_card.set_interactive(true)
	_hud.set_deck_label(_game.deck_label())
	_layout_cards()


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
		_judge_mark.show_correct(MpRules.CORRECT_PULSE_SECONDS)
	else:
		Audio.play_wrong()
		_judge_mark.show_wrong(MpRules.WRONG_PENALTY_SECONDS)
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


func _on_finished(seconds: float) -> void:
	_mine_card.set_interactive(false)
	_mine_card.stop_hints()
	_hud.set_deck_label(_game.deck_label())
	_hud.set_seconds(seconds)
	finished.emit(seconds)
