class_name MpQuitConfirm
extends Control
## 정말 나갈지 묻는다. 원본의 QUIT? 팝업이다.

signal confirmed()
signal dismissed()


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

	var panel := PanelContainer.new()
	panel.add_theme_stylebox_override("panel", MpUiKit.panel_style())
	panel.custom_minimum_size = Vector2(400.0, 0.0)
	center.add_child(panel)

	var column := VBoxContainer.new()
	column.add_theme_constant_override("separation", 20)
	panel.add_child(column)

	var title := MpUiKit.make_word_label("QUIT_TITLE", MpUiKit.FONT_BUTTON)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	column.add_child(title)

	var yes := MpUiKit.make_button("QUIT_YES")
	yes.pressed.connect(func() -> void: confirmed.emit())
	column.add_child(yes)

	var no := MpUiKit.make_button("QUIT_NO", MpUiKit.PANEL_BORDER)
	no.add_theme_color_override("font_color", MpUiKit.TEXT_LIGHT)
	no.pressed.connect(_on_dismiss)
	column.add_child(no)


func show_confirm() -> void:
	visible = true


func dismiss() -> void:
	visible = false


func _on_dismiss() -> void:
	dismiss()
	dismissed.emit()
