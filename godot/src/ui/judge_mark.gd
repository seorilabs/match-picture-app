class_name MpJudgeMark
extends Control
## 정답 O 와 오답 X.
##
## 원본은 내 카드 위 한가운데에 큼직하게 띄웠다. 오답 X 는 흔들린다.

const SHAKE_OFFSET := 8.0
const SHAKE_CYCLES := 12

var _label: Label
var _tween: Tween


func _init() -> void:
	# 부모가 자리를 직접 잡아 준다. 앵커 프리셋을 쓰면 _ready 뒤에 크기가 덮여
	# "non-equal opposite anchors" 경고가 난다.
	mouse_filter = Control.MOUSE_FILTER_IGNORE

	_label = MpUiKit.make_pixel_label("", MpUiKit.FONT_MARK)
	_label.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_label.visible = false
	add_child(_label)


func show_correct(duration: float) -> void:
	_stop()
	_label.text = "O"
	_label.add_theme_color_override("font_color", MpUiKit.CORRECT)
	_label.visible = true
	_tween = create_tween()
	_tween.tween_interval(duration)
	_tween.tween_callback(_hide)


func show_wrong(duration: float) -> void:
	_stop()
	_label.text = "X"
	_label.add_theme_color_override("font_color", MpUiKit.WRONG)
	_label.visible = true

	var step := duration / float(SHAKE_CYCLES * 2)
	_tween = create_tween()
	for i in SHAKE_CYCLES:
		_tween.tween_property(_label, "position:x", SHAKE_OFFSET, step)
		_tween.tween_property(_label, "position:x", -SHAKE_OFFSET, step)
	_tween.tween_callback(_hide)


func _hide() -> void:
	_label.visible = false
	_label.position.x = 0.0


func _stop() -> void:
	if _tween != null and _tween.is_valid():
		_tween.kill()
	_label.position.x = 0.0
