class_name MpJudgeMark
extends Control
## 정답 O 와 오답 X.
##
## 원본은 내 카드 정중앙에 큼직하게 띄웠지만, 이 버전은 판정된 심볼 위에 겹쳐 띄운다.
## 채점하듯 맞은 심볼에는 O 를 씌우고, 잘못 누른 심볼에는 X 를 긋는다.
## 오답 X 는 좌우로 흔들리고, 정답 O 는 맞은 심볼 양쪽(위·아래 카드)에 같이 뜬다.

## 마크 상자 한 변의 화면 픽셀 길이. 글자 칸(FONT_MARK_SYMBOL, 100x100)이 들어가고도
## 흔들릴 여유가 남는 크기로 둔다. 상자는 안 보이고 가운데 글자만 보인다.
const MARK_SIZE := 120.0

const SHAKE_OFFSET := 8.0
const SHAKE_CYCLES := 12

var _label: Label
var _tween: Tween
## 따라다닐 심볼. 카드가 미끄러지거나 화면이 바뀌어도 마크가 심볼을 놓치지 않는다.
var _button: MpSymbolButton = null


func _init() -> void:
	# 부모가 자리를 직접 잡아 준다. 앵커 프리셋을 쓰면 _ready 뒤에 크기가 덮여
	# "non-equal opposite anchors" 경고가 난다.
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	size = Vector2(MARK_SIZE, MARK_SIZE)
	pivot_offset = size / 2.0

	_label = MpUiKit.make_pixel_label("", MpUiKit.FONT_MARK_SYMBOL)
	_label.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_label.visible = false
	add_child(_label)

	set_process(false)


## 심볼 버튼 위에 마크를 겹쳐 띄운다. 색·문자·지속 시간은 호출자가 정한다.
## shake 가 true 이면 가로로 흔들리며, 정답/오답의 차이를 주는 데 쓴다.
## duration 이 0 이하이면 dismiss() 할 때까지 그대로 떠 있는다. 최초 실행 안내가 쓴다.
## 버튼이 사라졌거나 null 이면 마크를 숨기고 끝낸다.
func show_on_symbol(button: MpSymbolButton, text: String, color: Color, duration: float, shake: bool) -> void:
	_stop()
	if button == null or not button.is_visible_in_tree():
		_hide()
		return
	_button = button
	_center_on(button)
	set_process(true)
	_label.text = text
	_label.add_theme_color_override("font_color", color)
	_label.visible = true
	_label.position.x = 0.0
	if duration <= 0.0:
		return

	_tween = create_tween()
	if shake:
		var step := duration / float(SHAKE_CYCLES * 2)
		for i in SHAKE_CYCLES:
			_tween.tween_property(_label, "position:x", SHAKE_OFFSET, step)
			_tween.tween_property(_label, "position:x", -SHAKE_OFFSET, step)
	else:
		_tween.tween_interval(duration)
	_tween.tween_callback(_hide)


## 심볼이 움직이는 동안에도 그 위에 붙어 있게 매 프레임 다시 잰다.
##
## 카드가 자리를 옮기는 연출과 판정 연출이 같은 시간에 돈다. 띄우는 순간 한 번만
## 재 두면 카드는 내려가는데 마크만 제자리에 남는다.
func _process(_delta: float) -> void:
	if _button == null or not _label.visible:
		set_process(false)
		return
	if _button.is_visible_in_tree():
		_center_on(_button)


## 다음 판으로 넘어갈 때처럼 연출을 끊고 싶을 때 부른다.
## CanvasItem 가 같은 이름의 native hide() 를 갖고 있어 이름을 비켜 둔다.
func dismiss() -> void:
	_stop()
	_hide()


## 마크 중심을 심볼 중심에 맞춘다.
##
## 카드 배율과 정답 펄스는 심볼 중심을 pivot 으로 걸려 중심을 흔들지 않지만,
## 카드가 통째로 미끄러지면 중심도 함께 움직인다. 그래서 매 프레임 다시 잰다.
func _center_on(button: MpSymbolButton) -> void:
	var center := button.global_center()
	var parent := get_parent() as CanvasItem
	if parent != null:
		center = parent.get_global_transform().affine_inverse() * center
	# 이쪽도 회전·배율이 pivot 기준이라 보이는 중심은 언제나 position + pivot_offset 이다.
	position = center - pivot_offset


func _hide() -> void:
	_label.visible = false
	_label.position.x = 0.0
	_button = null
	set_process(false)


func _stop() -> void:
	if _tween != null and _tween.is_valid():
		_tween.kill()
	_label.position.x = 0.0
