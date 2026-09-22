class_name MpHud
extends Control
## 남은 카드 수와 경과 시간, 그리고 최고 기록.
##
## 원본은 조커 아이콘 옆에 남은 카드, 스톱워치 아이콘 옆에 초를 뒀다. 둘 다 픽셀 폰트다.
## 여기에 최고 기록 한 줄을 더한다. 기록은 원래 저장만 되고 판이 끝나야 보였는데,
## 겨룰 대상이 플레이 중에 보이지 않으면 시간을 재는 의미가 옅어진다.

const ICON_SIZE := 56.0

## 정답을 맞힌 순간 최고 기록 자리에 페이스 차이를 띄우는 시간.
## 다음 정답이 오기 전에 원래 표시로 돌아올 만큼 짧게 둔다.
const PACE_HOLD_SECONDS := 1.2

## 최고 기록 앞에 붙는 말. 픽셀 폰트에 한글 글리프가 없어 번역하지 않고 ASCII 로 둔다.
## HUD 의 나머지도 전부 숫자와 기호뿐이라 이 줄만 도현체로 바뀌면 오히려 튄다.
const BEST_PREFIX := "BEST "

var _deck_label: Label
var _time_label: Label
var _best_label: Label
var _best_seconds := MpBestRecord.NO_RECORD
var _pace_tween: Tween


func _init() -> void:
	custom_minimum_size = Vector2(0.0, MpRules.HUD_HEIGHT)
	mouse_filter = Control.MOUSE_FILTER_IGNORE

	# 남은 카드는 왼쪽 끝. 카드 좌우 여백과 같은 값을 써서 보드와 세로선을 맞춘다.
	var left_row := HBoxContainer.new()
	left_row.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	left_row.offset_left = MpRules.CARD_SIDE_MARGIN
	left_row.offset_right = -MpRules.CARD_SIDE_MARGIN
	left_row.alignment = BoxContainer.ALIGNMENT_BEGIN
	left_row.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(left_row)

	var deck_group := _make_group("res://assets/icons/joker.png")
	_deck_label = _make_value_label(str(MpRules.TOTAL_CARDS))
	deck_group.add_child(_deck_label)
	left_row.add_child(deck_group)

	# 시간은 화면 정중앙에 둔다. 같은 행의 왼쪽 묶음과 폭을 나눠 쓰면 남은 카드 수가
	# 10 에서 9 로 줄 때 시간이 옆으로 밀린다. 가운데 정렬을 따로 걸어 고정한다.
	var center := CenterContainer.new()
	center.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	center.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(center)

	# 시간 아래에 최고 기록을 붙인다. 기록이 없으면 줄째로 숨어 원래 HUD 와 같아진다.
	var stack := VBoxContainer.new()
	stack.add_theme_constant_override("separation", 0)
	stack.mouse_filter = Control.MOUSE_FILTER_IGNORE

	_time_label = _make_value_label(MpRules.format_seconds(0.0))
	_time_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	stack.add_child(_time_label)

	_best_label = MpUiKit.make_pixel_label("", MpUiKit.FONT_HUD_SUB)
	_best_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_best_label.visible = false
	stack.add_child(_best_label)

	var time_group := _make_group("res://assets/icons/stopwatch.png")
	time_group.add_child(stack)
	center.add_child(time_group)


func set_deck_label(text: String) -> void:
	_deck_label.text = text


func set_seconds(seconds: float) -> void:
	_time_label.text = MpRules.format_seconds(seconds)


## 판을 시작할 때 한 번 준다. 기록이 없으면 줄을 숨긴다.
func set_best_seconds(seconds: float) -> void:
	_best_seconds = seconds
	_stop_pace()
	_show_best()


## 정답을 맞힌 순간 최고 기록 자리에 페이스 차이를 잠깐 띄운다.
## 앞서 있으면 초록, 뒤져 있으면 빨강이다. 비교할 기록이 없으면 아무 일도 하지 않는다.
func show_pace(delta_seconds: float) -> void:
	if not MpBestRecord.has_record(_best_seconds):
		return
	_stop_pace()
	_best_label.text = MpRules.format_delta_seconds(delta_seconds)
	_best_label.add_theme_color_override(
		"font_color", MpUiKit.WRONG if delta_seconds > 0.0 else MpUiKit.CORRECT)
	_best_label.visible = true

	_pace_tween = create_tween()
	_pace_tween.tween_interval(PACE_HOLD_SECONDS)
	_pace_tween.tween_callback(_show_best)


func _show_best() -> void:
	if not MpBestRecord.has_record(_best_seconds):
		_best_label.visible = false
		return
	_best_label.text = BEST_PREFIX + MpRules.format_seconds(_best_seconds)
	_best_label.add_theme_color_override("font_color", MpUiKit.TEXT_LIGHT)
	_best_label.visible = true


func _stop_pace() -> void:
	if _pace_tween != null and _pace_tween.is_valid():
		_pace_tween.kill()
	_pace_tween = null


## 아이콘 하나를 담은 가로 묶음. 값 노드는 부르는 쪽이 붙인다.
func _make_group(icon_path: String) -> HBoxContainer:
	var group := HBoxContainer.new()
	group.add_theme_constant_override("separation", 10)
	group.mouse_filter = Control.MOUSE_FILTER_IGNORE
	group.alignment = BoxContainer.ALIGNMENT_CENTER

	var icon := TextureRect.new()
	icon.custom_minimum_size = Vector2(ICON_SIZE, ICON_SIZE)
	icon.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	icon.mouse_filter = Control.MOUSE_FILTER_IGNORE
	if ResourceLoader.exists(icon_path):
		var loaded: Variant = ResourceLoader.load(icon_path)
		if loaded is Texture2D:
			icon.texture = loaded
	group.add_child(icon)
	return group


func _make_value_label(text: String) -> Label:
	var label := MpUiKit.make_pixel_label(text, MpUiKit.FONT_HUD)
	label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	return label
