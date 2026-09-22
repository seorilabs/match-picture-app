class_name MpTutorialOverlay
extends Control
## 최초 1회만 뜨는 안내.
##
## 원본 `GameScene.unity` 의 PanelTutorial 을 되살린 것이다. 글자가 한 자도 없었다.
## 반투명 흰 막 위에 예시 카드 두 장을 실제 카드와 같은 자리에 깔고, 두 카드에 함께
## 들어 있는 그림에 O 를 찍고, 아래 카드의 그 그림을 손가락이 가리킨다. 규칙을 문장
## 대신 그림으로 보여 주므로 번역할 문구가 없다.
##
## 원본은 PlayerPrefs["HasPlayed"] 로 한 번만 보여 줬다. 기획 정본이 "인터랙티브
## 튜토리얼은 추가하지 않는다" 고 못박아 둔 자리라, 정지된 그림 한 장에서 끝낸다.

signal closed()

const FINGER_PATH := "res://assets/icons/finger.png"

## 손가락 그림 한 변. 원본 PanelMine 안 Image 가 150x150 이었다. 카드 좌표계 값이다.
const FINGER_SIZE := 150.0

## 심볼 중심에서 손가락 중심까지. 원본은 심볼 (-169,-116) 아래 (-169,-200) 이었다.
## 손끝이 O 안으로 들어가 그림을 짚는 모양이 된다.
const FINGER_DROP := 84.0

## 안내의 O 상자 한 변. 원본은 심볼(100) 위에 300x300 / 250pt 로 큼직하게 씌워
## 그림을 가리지 않고 감쌌다. 판정용 마크(MARK_SIZE)를 이만큼 키워 쓴다.
const ANSWER_MARK_SIZE := 300.0

## 닫기 버튼 한 변과 무대 오른쪽 위에서 띄우는 거리.
## 원본 Button 은 100x100 에 우상단 기준 (-60, -160) 이었고, 그중 100 은 HUD 몫이다.
const CLOSE_SIZE := 100.0
const CLOSE_INSET := 60.0

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
var _answer := ""


func _init(library: MpSymbolLibrary) -> void:
	_library = library
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_STOP
	visible = false

	# 원본과 같은 반투명 흰색 오버레이.
	var shade := ColorRect.new()
	shade.color = Color(1.0, 1.0, 1.0, 0.392)
	shade.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	shade.mouse_filter = Control.MOUSE_FILTER_STOP
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

	var close := MpUiKit.make_icon_button("X")
	close.set_anchors_preset(Control.PRESET_TOP_RIGHT)
	close.offset_left = -CLOSE_INSET - CLOSE_SIZE
	close.offset_right = -CLOSE_INSET
	close.offset_top = CLOSE_INSET
	close.offset_bottom = CLOSE_INSET + CLOSE_SIZE
	close.pressed.connect(_on_close)
	_board.add_child(close)

	_build_example()


## 게임 화면이 카드를 놓는 자리를 그대로 받아 예시 카드를 맞춘다.
func set_stage_rect(rect: Rect2) -> void:
	if rect.size.x <= 0.0 or rect.size.y <= 0.0:
		return
	_board.global_position = rect.position
	_board.size = rect.size
	_layout()


func show_overlay() -> void:
	visible = true
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
