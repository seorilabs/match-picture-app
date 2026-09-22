class_name MpTutorialOverlay
extends Control
## 최초 1회만 뜨는 안내.
##
## 원본 `GameScene.unity` 의 PanelTutorial 을 바탕으로 한다. 반투명 흰 막 위에 예시
## 카드 두 장을 실제 카드와 같은 자리에 깔고, 두 카드에 함께 들어 있는 그림에 O 를
## 찍고, 아래 카드의 그 그림을 손가락이 가리킨다. 좌표와 크기는 원본 씬에서 옮겼다.
##
## 원본과 다른 점은 이것을 한 장에 다 보여 주지 않고 세 단계로 나눈 것이다. 한 장에
## 몰아 놓으면 무엇을 보라는 것인지, 어떻게 닫는 것인지가 드러나지 않았다. 단계마다
## 다음으로 가는 방법을 화면에 적어 둔다.
##
## 기획 정본은 "게임 위에 단계별 오버레이를 얹는 인터랙티브 튜토리얼은 추가하지
## 않는다" 고 적어 두었다. 이 단계 방식은 그 문구와 겹치며 사용자 결정으로 들어왔다.
## 실제 판 위가 아니라 예시 판 위에서만 돌고, 탭으로 넘길 뿐 조작을 가르치지 않는다.

signal closed()

const FINGER_PATH := "res://assets/icons/finger.png"

## 안내 띠가 차지하는 화면 아래쪽 높이와 좌우·아래 여백.
const STEP_BAR_HEIGHT := 240.0
const STEP_MARGIN := 24.0

## 손가락 그림 한 변. 원본 PanelMine 안 Image 가 150x150 이었다. 카드 좌표계 값이다.
const FINGER_SIZE := 150.0

## 심볼 중심에서 손가락 중심까지. 원본은 심볼 (-169,-116) 아래 (-169,-200) 이었다.
## 손끝이 O 안으로 들어가 그림을 짚는 모양이 된다.
const FINGER_DROP := 84.0

## 안내의 O 상자 한 변. 심볼 한 변(100)의 두 배다.
##
## 원본은 300 이었지만 그 크기로는 O 가 카드의 절반을 덮어 무엇을 가리키는지보다
## 동그라미가 먼저 보였다. 심볼을 감싸되 이웃 그림을 침범하지 않는 선으로 줄인다.
const ANSWER_MARK_SIZE := 200.0

## 안내 단계. 카드 → 같은 그림 → 누를 자리 순으로 하나씩 더해 보여 준다.
enum Step { CARDS, MATCH, TAP }
const LAST_STEP := Step.TAP

## 예시 카드를 뽑는 씨앗. 안내 그림은 언제 켜도 같아야 한다.
const EXAMPLE_SEED := 20200704

## 예시 정답을 놓을 앵커 번호. 원본 안내가 O 를 찍어 둔 자리 그대로다.
## 위 카드는 한가운데(-1, -26), 아래 카드는 왼쪽 아래(-169, 116) 다.
## 같은 그림이 카드마다 다른 자리에 있다는 것이 이 안내가 전하려는 전부다.
const OPPONENT_ANSWER_SPOT := 1
const MINE_ANSWER_SPOT := 0

var _library: MpSymbolLibrary
var _board: Control
var _opponent_card: MpCardView
var _mine_card: MpCardView
var _opponent_mark: MpJudgeMark
var _mine_mark: MpJudgeMark
var _finger: TextureRect
var _hint: PanelContainer
var _hint_label: Label
var _progress: Label
var _start_button: Button
var _answer := ""
var _step: Step = Step.CARDS


func _init(library: MpSymbolLibrary) -> void:
	_library = library
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_STOP
	visible = false

	# 원본과 같은 반투명 흰색 오버레이.
	var shade := ColorRect.new()
	shade.color = Color(1.0, 1.0, 1.0, 0.392)
	shade.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	# IGNORE 여야 한다. STOP 이면 막이 탭을 자기가 먹고 거기서 전파가 끊겨,
	# 아래 `_gui_input` 이 아예 불리지 않는다. 뒤쪽 게임 화면을 막는 것은
	# 이 오버레이 자신이 MOUSE_FILTER_STOP 이라 이미 된다.
	shade.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(shade)

	# 예시 카드가 실제 카드와 같은 자리에 오도록, 무대 rect 를 받아 그대로 쓴다.
	_board = Control.new()
	_board.clip_contents = false
	_board.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(_board)

	_opponent_card = _make_example_card()
	_mine_card = _make_example_card()

	# 마크는 카드보다 뒤에 붙어야 위에 그려진다.
	_opponent_mark = MpJudgeMark.new()
	_board.add_child(_opponent_mark)
	_mine_mark = MpJudgeMark.new()
	_board.add_child(_mine_mark)

	_finger = TextureRect.new()
	_finger.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	_finger.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	_finger.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_finger.size = Vector2(FINGER_SIZE, FINGER_SIZE)
	if ResourceLoader.exists(FINGER_PATH):
		var loaded: Variant = ResourceLoader.load(FINGER_PATH)
		if loaded is Texture2D:
			_finger.texture = loaded
	_board.add_child(_finger)

	_build_steps()
	_build_example()


## 카드 아래에 겹쳐 놓는 안내 띠와 시작 버튼.
##
## 카드 두 장이 무대를 거의 다 채워서 아래에 빈 자리가 없다. 카드 위에 반투명 띠를
## 깔고 그 위에 글자를 얹는다.
func _build_steps() -> void:
	# 전체 화면 여백 컨테이너 안에 두면 띠가 화면 밖으로 밀리지 않는다.
	var frame := MarginContainer.new()
	frame.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	frame.add_theme_constant_override("margin_left", int(STEP_MARGIN))
	frame.add_theme_constant_override("margin_right", int(STEP_MARGIN))
	frame.add_theme_constant_override("margin_bottom", int(STEP_MARGIN))
	frame.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(frame)

	var column := VBoxContainer.new()
	column.alignment = BoxContainer.ALIGNMENT_END
	column.add_theme_constant_override("separation", 12)
	column.mouse_filter = Control.MOUSE_FILTER_IGNORE
	frame.add_child(column)

	_hint = PanelContainer.new()
	_hint.add_theme_stylebox_override("panel", MpUiKit.hint_style())
	_hint.mouse_filter = Control.MOUSE_FILTER_IGNORE
	column.add_child(_hint)

	# 문구와 진행 표시를 세로로 쌓는다. 한 줄에 붙이면 한국어 문장이 폭을 넘긴다.
	var stack := VBoxContainer.new()
	stack.add_theme_constant_override("separation", 6)
	stack.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_hint.add_child(stack)

	_hint_label = MpUiKit.make_word_label("", MpUiKit.FONT_BODY, MpUiKit.TEXT_LIGHT)
	_hint_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_hint_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_hint_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	stack.add_child(_hint_label)

	# 몇 단계 중 몇 번째인지와, 어떻게 넘기는지. 숫자와 한글이 한 줄에 섞이므로
	# 픽셀 폰트를 쓰지 않는다.
	_progress = MpUiKit.make_word_label("", MpUiKit.FONT_HUD_SUB, MpUiKit.TEXT_LIGHT)
	_progress.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_progress.mouse_filter = Control.MOUSE_FILTER_IGNORE
	stack.add_child(_progress)

	_start_button = MpUiKit.make_button("TITLE_START")
	_start_button.pressed.connect(_on_close)
	column.add_child(_start_button)


## 마지막 단계 전에는 화면 아무 곳이나 눌러 다음으로 간다.
## 어디를 눌러야 하는지 찾게 만들지 않으려고 판정 영역을 화면 전체로 둔다.
func _gui_input(event: InputEvent) -> void:
	if not visible or _step == LAST_STEP:
		return
	# 마우스 눌림만 본다. 터치도 같이 받으면 탭 한 번에 두 단계가 넘어간다.
	# `project.godot` 의 `pointing/emulate_touch_from_mouse` 가 켜져 있어 클릭
	# 하나가 마우스와 터치 양쪽으로 도착하고, 반대로 터치 기기에서는 엔진 기본값
	# `emulate_mouse_from_touch` 가 터치를 마우스로 바꿔 준다. 어느 쪽이든 마우스
	# 이벤트는 정확히 한 번 온다. 화면의 다른 Button 들도 같은 경로로 동작한다.
	var mouse := event as InputEventMouseButton
	if mouse == null or not mouse.pressed:
		return
	accept_event()
	_show_step((_step + 1) as Step)


func _show_step(step: Step) -> void:
	_step = step
	_opponent_mark.visible = step >= Step.MATCH
	_mine_mark.visible = step >= Step.MATCH
	_finger.visible = step >= Step.TAP
	_hint.visible = step != LAST_STEP
	_start_button.visible = step == LAST_STEP
	# 구분자는 도현체에 있는 글자만 쓴다. 가운뎃점(U+00B7)은 이 폰트의 유니코드
	# cmap 에 없어서 두부 상자로 그려진다. tools/check_font_coverage.py 가 막는다.
	_progress.text = "%d/%d | %s" % [step + 1, LAST_STEP + 1, tr("TUTORIAL_NEXT")]
	match step:
		Step.CARDS:
			_hint_label.text = "TUTORIAL_STEP_CARDS"
		Step.MATCH:
			_hint_label.text = "TUTORIAL_STEP_MATCH"
		_:
			pass


## 게임 화면이 카드를 놓는 자리를 그대로 받아 예시 카드를 맞춘다.
func set_stage_rect(rect: Rect2) -> void:
	if rect.size.x <= 0.0 or rect.size.y <= 0.0:
		return
	_board.global_position = rect.position
	_board.size = rect.size
	_layout()


func show_overlay() -> void:
	visible = true
	_show_step(Step.CARDS)
	# 숨어 있는 동안에는 마크가 심볼 자리를 재지 못한다. 보이고 나서 다시 찍는다.
	_layout()


## 예시 카드 두 장. 실제 카드와 같은 부품이라 그림도 배치도 그대로다.
func _make_example_card() -> MpCardView:
	var card := MpCardView.new()
	card.set_interactive(false)
	_board.add_child(card)
	return card


## 두 카드에 함께 있는 그림 하나를 보여 주는 예시 판을 만든다.
##
## 사영평면 덱에서 뽑으므로 공통 그림은 실제 게임과 똑같이 정확히 하나다.
func _build_example() -> void:
	var rng := RandomNumberGenerator.new()
	rng.seed = EXAMPLE_SEED
	var cards := MpDeck.build(MpRules.PRIME, 2, rng)
	if cards.size() < 2:
		push_warning("예시 카드를 만들지 못했다. 안내 그림이 비어 보인다.")
		return

	_answer = MpDeck.find_common_symbol(cards[0], cards[1])
	var spots := _example_spots()
	_opponent_card.show_card(_move_answer(cards[0], OPPONENT_ANSWER_SPOT), spots, _library)
	_mine_card.show_card(_move_answer(cards[1], MINE_ANSWER_SPOT), spots, _library)


## 안내용 배치. 원본 Card.prefab 의 디자인 시점 그대로 회전 0, 배율 1 이다.
## 실제 판은 매 라운드 흔들리지만, 규칙을 처음 보는 사람에게는 반듯한 쪽이 읽힌다.
func _example_spots() -> Array[MpSymbolSpot]:
	var spots: Array[MpSymbolSpot] = []
	for anchor in MpPlacement.ANCHORS:
		spots.append(MpSymbolSpot.new(anchor, 0.0, 1.0))
	return spots


## 정답 그림을 정해진 앵커로 옮긴다. 자리를 고정해야 손가락이 늘 같은 곳을 가리킨다.
func _move_answer(card: PackedStringArray, spot_index: int) -> PackedStringArray:
	var moved := card.duplicate()
	var found := moved.find(_answer)
	if found < 0 or spot_index >= moved.size():
		return moved
	moved[found] = moved[spot_index]
	moved[spot_index] = _answer
	return moved


func _layout() -> void:
	if _board.size.x <= 0.0 or _board.size.y <= 0.0:
		return
	var layout := MpCardLayout.compute(_board.size)
	for card in [_opponent_card, _mine_card]:
		card.scale = Vector2(layout.factor, layout.factor)
	_opponent_card.position = layout.opponent_position
	_mine_card.position = layout.mine_position

	# 두 카드의 같은 그림에 O 를 씌운다. 닫을 때까지 떠 있어야 하므로 지속으로 띄운다.
	# 마크는 카드 좌표계 300 짜리라, 카드와 같은 배율로 키워야 그림을 감싼다.
	var mark_scale := ANSWER_MARK_SIZE / MpJudgeMark.MARK_SIZE * layout.factor
	for mark in [_opponent_mark, _mine_mark]:
		mark.scale = Vector2(mark_scale, mark_scale)
	_opponent_mark.show_on_symbol(
		_opponent_card.find_symbol(_answer), "O", MpUiKit.CORRECT, 0.0, false)
	_mine_mark.show_on_symbol(
		_mine_card.find_symbol(_answer), "O", MpUiKit.CORRECT, 0.0, false)

	_place_finger(layout.factor)
	# show_on_symbol 과 _place_finger 가 visible 을 켜므로 단계 가시성을 다시 씌운다.
	_opponent_mark.visible = _step >= Step.MATCH
	_mine_mark.visible = _step >= Step.MATCH
	_finger.visible = _step >= Step.TAP


## 아래 카드의 정답 그림 바로 아래에 손가락을 놓는다. 손끝이 위를 가리키는 그림이다.
func _place_finger(factor: float) -> void:
	var target := _mine_card.find_symbol(_answer)
	if target == null:
		_finger.visible = false
		return
	_finger.visible = true
	_finger.scale = Vector2(factor, factor)
	var center := _board.get_global_transform().affine_inverse() * target.global_center()
	var offset := Vector2(-FINGER_SIZE / 2.0, FINGER_DROP - FINGER_SIZE / 2.0)
	_finger.position = center + offset * factor


func _on_close() -> void:
	visible = false
	closed.emit()
