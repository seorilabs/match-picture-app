class_name MpTitleScreen
extends Control
## 앱을 켜면 처음 뜨는 화면.
##
## 원본에도 웹 포팅본에도 없던 화면이다. 원본은 게임 씬 하나로 곧장 들어갔다.
## 그래도 두는 이유는 기록 게임이기 때문이다. 초시계는 첫 정답 뒤에 켜지므로 급하게
## 시작되는 불공정은 없지만, 겨룰 기록을 한 번 보고 시작하는 것과 보드에 툭 떨어지는
## 것은 다르다. 여기서 보여 주는 값은 둘 다 이미 저장하고 있던 것이다.

signal start_pressed()

## 덱을 뜻하는 조커 카드. HUD 의 남은 카드 아이콘과 같은 그림이라 따로 만들지 않는다.
const EMBLEM_PATH := "res://assets/icons/joker.png"
const EMBLEM_SIZE := 180.0

var _best_label: Label
var _clears_label: Label


func _init() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_STOP
	visible = false

	# 게임 화면을 가리는 대신 같은 배경을 깔아 둔다. 반투명으로 두면 아직 시작하지 않은
	# 빈 카드 두 장이 비쳐 보인다.
	var background := TextureRect.new()
	background.texture = MpUiKit.background_texture()
	background.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	background.stretch_mode = TextureRect.STRETCH_SCALE
	background.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	background.mouse_filter = Control.MOUSE_FILTER_STOP
	add_child(background)

	var center := CenterContainer.new()
	center.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	center.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(center)

	var column := VBoxContainer.new()
	column.add_theme_constant_override("separation", 24)
	column.custom_minimum_size = Vector2(440.0, 0.0)
	center.add_child(column)

	var emblem := TextureRect.new()
	emblem.custom_minimum_size = Vector2(0.0, EMBLEM_SIZE)
	emblem.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	emblem.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	emblem.mouse_filter = Control.MOUSE_FILTER_IGNORE
	if ResourceLoader.exists(EMBLEM_PATH):
		var loaded: Variant = ResourceLoader.load(EMBLEM_PATH)
		if loaded is Texture2D:
			emblem.texture = loaded
	column.add_child(emblem)

	var name_label := MpUiKit.make_word_label("TITLE_NAME", MpUiKit.FONT_TITLE, MpUiKit.TEXT_LIGHT)
	name_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	column.add_child(name_label)

	_best_label = MpUiKit.make_word_label("", MpUiKit.FONT_BODY, MpUiKit.TEXT_LIGHT)
	_best_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	column.add_child(_best_label)

	_clears_label = MpUiKit.make_word_label("", MpUiKit.FONT_BODY, MpUiKit.TEXT_LIGHT)
	_clears_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	column.add_child(_clears_label)

	var start := MpUiKit.make_button("TITLE_START")
	start.pressed.connect(func() -> void: start_pressed.emit())
	column.add_child(start)


## 세이브에 있는 값을 그대로 받는다. 아직 기록이 없으면 그 줄은 비워 둔다.
func show_title(best_seconds: float, clear_count: int) -> void:
	# 값이 끼는 문구는 조립한 순간의 로케일로 굳는다. 띄울 때마다 다시 만든다.
	if MpBestRecord.has_record(best_seconds):
		_best_label.text = tr("RESULT_BEST").format([MpRules.format_seconds(best_seconds)])
	else:
		_best_label.text = ""
	_clears_label.text = tr("TITLE_CLEARS").format([clear_count]) if clear_count > 0 else ""
	visible = true


func hide_title() -> void:
	visible = false
