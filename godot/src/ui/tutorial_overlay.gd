class_name MpTutorialOverlay
extends Control
## 최초 1회만 뜨는 설명.
##
## 원본은 PlayerPrefs["HasPlayed"] 로 한 번만 보여 줬다. 기획 정본이 "인터랙티브
## 튜토리얼은 추가하지 않는다" 고 못박아 둔 자리라, 설명 한 장에서 끝낸다.

signal closed()

const FINGER_PATH := "res://assets/icons/finger.png"


func _init() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_STOP
	visible = false

	# 원본과 같은 반투명 흰색 오버레이.
	var shade := ColorRect.new()
	shade.color = Color(1.0, 1.0, 1.0, 0.392)
	shade.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	shade.mouse_filter = Control.MOUSE_FILTER_STOP
	add_child(shade)

	var center := CenterContainer.new()
	center.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	center.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(center)

	var panel := PanelContainer.new()
	panel.add_theme_stylebox_override("panel", MpUiKit.panel_style())
	panel.custom_minimum_size = Vector2(460.0, 0.0)
	center.add_child(panel)

	var column := VBoxContainer.new()
	column.add_theme_constant_override("separation", 22)
	panel.add_child(column)

	var title := MpUiKit.make_word_label("TUTORIAL_TITLE", MpUiKit.FONT_BUTTON)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	column.add_child(title)

	var finger := TextureRect.new()
	finger.custom_minimum_size = Vector2(0.0, 120.0)
	finger.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	finger.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	finger.mouse_filter = Control.MOUSE_FILTER_IGNORE
	if ResourceLoader.exists(FINGER_PATH):
		var loaded: Variant = ResourceLoader.load(FINGER_PATH)
		if loaded is Texture2D:
			finger.texture = loaded
	column.add_child(finger)

	var body := MpUiKit.make_word_label("TUTORIAL_BODY", MpUiKit.FONT_BODY)
	body.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	body.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	column.add_child(body)

	var start := MpUiKit.make_button("TUTORIAL_CLOSE")
	start.pressed.connect(_on_close)
	column.add_child(start)


func show_overlay() -> void:
	visible = true


func _on_close() -> void:
	visible = false
	closed.emit()
