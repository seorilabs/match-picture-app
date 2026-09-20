class_name MpResultPopup
extends Control
## 한 판이 끝나고 뜨는 기록 화면.
##
## 원본은 걸린 초와 RETRY / SHARE / EXIT 만 있었다. 개인 기록을 더한다.

signal retry_pressed()
signal share_pressed()
signal exit_pressed()

var _seconds_label: Label
var _best_label: Label
var _panel: PanelContainer


func _init() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_STOP
	visible = false

	var shade := ColorRect.new()
	shade.color = Color(0.0, 0.0, 0.0, 0.45)
	shade.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	shade.mouse_filter = Control.MOUSE_FILTER_STOP
	add_child(shade)

	var center := CenterContainer.new()
	center.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	center.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(center)

	_panel = PanelContainer.new()
	_panel.add_theme_stylebox_override("panel", MpUiKit.panel_style())
	_panel.custom_minimum_size = Vector2(440.0, 0.0)
	center.add_child(_panel)

	var column := VBoxContainer.new()
	column.add_theme_constant_override("separation", 20)
	_panel.add_child(column)

	_seconds_label = MpUiKit.make_pixel_label("0s", MpUiKit.FONT_RESULT, MpUiKit.TEXT_DARK)
	_seconds_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	column.add_child(_seconds_label)

	_best_label = MpUiKit.make_word_label("", MpUiKit.FONT_BODY)
	_best_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	column.add_child(_best_label)

	var retry := MpUiKit.make_button("RETRY")
	retry.pressed.connect(func() -> void: retry_pressed.emit())
	column.add_child(retry)

	var share := MpUiKit.make_button("SHARE", MpUiKit.PANEL_BORDER)
	share.add_theme_color_override("font_color", MpUiKit.TEXT_LIGHT)
	share.pressed.connect(func() -> void: share_pressed.emit())
	column.add_child(share)

	var quit_button := MpUiKit.make_button("EXIT", MpUiKit.PANEL_BORDER)
	quit_button.add_theme_color_override("font_color", MpUiKit.TEXT_LIGHT)
	quit_button.pressed.connect(func() -> void: exit_pressed.emit())
	column.add_child(quit_button)


func show_result(seconds: float, best_seconds: float, is_new_best: bool) -> void:
	_seconds_label.text = MpRules.format_seconds(seconds)
	if is_new_best:
		_best_label.text = "NEW BEST"
		_best_label.add_theme_color_override("font_color", MpUiKit.CORRECT)
	elif MpBestRecord.has_record(best_seconds):
		_best_label.text = "BEST %s" % MpRules.format_seconds(best_seconds)
		_best_label.add_theme_color_override("font_color", MpUiKit.TEXT_DARK)
	else:
		_best_label.text = ""
	visible = true


func hide_result() -> void:
	visible = false
