class_name MpSettingsPopup
extends Control
## 언어와 소리.
##
## 원본에는 없던 화면이다. 한국어와 영어를 넣었으니 기기 설정과 다르게 고를 수단이
## 있어야 하고, 소리는 조용한 곳에서 끌 수 있어야 한다. 그 둘만 둔다.

signal closed()

const LANGUAGE_KEYS := {"auto": "LANG_AUTO", "ko": "LANG_KO", "en": "LANG_EN"}

var _language_buttons: Dictionary = {}
var _sound_button: Button


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
	panel.custom_minimum_size = Vector2(440.0, 0.0)
	center.add_child(panel)

	var column := VBoxContainer.new()
	column.add_theme_constant_override("separation", 16)
	panel.add_child(column)

	var title := MpUiKit.make_word_label("SETTINGS_TITLE", MpUiKit.FONT_BUTTON)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	column.add_child(title)

	column.add_child(MpUiKit.make_word_label("SETTINGS_LANGUAGE", MpUiKit.FONT_BODY))
	for language in Locale.OPTIONS:
		var button := MpUiKit.make_button(LANGUAGE_KEYS[language], MpUiKit.PANEL_BORDER)
		button.add_theme_color_override("font_color", MpUiKit.TEXT_LIGHT)
		button.pressed.connect(_on_language_pressed.bind(language))
		column.add_child(button)
		_language_buttons[language] = button

	column.add_child(MpUiKit.make_word_label("SETTINGS_SOUND", MpUiKit.FONT_BODY))
	_sound_button = MpUiKit.make_button("", MpUiKit.PANEL_BORDER)
	_sound_button.add_theme_color_override("font_color", MpUiKit.TEXT_LIGHT)
	_sound_button.pressed.connect(_on_sound_pressed)
	column.add_child(_sound_button)

	var close := MpUiKit.make_button("SETTINGS_CLOSE")
	close.pressed.connect(_on_close)
	column.add_child(close)


func show_settings() -> void:
	_refresh()
	visible = true


func dismiss() -> void:
	visible = false


## 고른 항목을 눌러 둔 것처럼 보이게 한다. 라디오 버튼 부품을 따로 쓰지 않는다.
func _refresh() -> void:
	var selected := Locale.selected_language()
	for language in _language_buttons:
		var button: Button = _language_buttons[language]
		var active: bool = language == selected
		button.add_theme_stylebox_override(
			"normal", MpUiKit.button_style(MpUiKit.BUTTON if active else MpUiKit.PANEL_BORDER)
		)
		button.add_theme_color_override(
			"font_color", MpUiKit.BUTTON_TEXT if active else MpUiKit.TEXT_LIGHT
		)
	_sound_button.text = "SETTINGS_SOUND_OFF" if Audio.is_muted() else "SETTINGS_SOUND_ON"


func _on_language_pressed(language: String) -> void:
	Locale.set_language(language)
	_refresh()


func _on_sound_pressed() -> void:
	Audio.set_muted(not Audio.is_muted())
	_refresh()


func _on_close() -> void:
	dismiss()
	closed.emit()
