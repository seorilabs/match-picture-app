class_name MpHud
extends Control
## 남은 카드 수와 경과 시간.
##
## 원본은 조커 아이콘 옆에 남은 카드, 스톱워치 아이콘 옆에 초를 뒀다. 둘 다 픽셀 폰트다.

const ICON_SIZE := 56.0

var _deck_label: Label
var _time_label: Label


func _init() -> void:
	custom_minimum_size = Vector2(0.0, MpRules.HUD_HEIGHT)
	mouse_filter = Control.MOUSE_FILTER_IGNORE

	var row := HBoxContainer.new()
	row.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	row.add_theme_constant_override("separation", 12)
	row.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(row)

	var deck_group := _make_group("res://assets/icons/joker.png", MpRules.TOTAL_CARDS)
	_deck_label = deck_group[1]
	row.add_child(deck_group[0])

	var spacer := Control.new()
	spacer.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	spacer.mouse_filter = Control.MOUSE_FILTER_IGNORE
	row.add_child(spacer)

	var time_group := _make_group("res://assets/icons/stopwatch.png", 0)
	_time_label = time_group[1]
	_time_label.text = MpRules.format_seconds(0.0)
	row.add_child(time_group[0])


func set_deck_label(text: String) -> void:
	_deck_label.text = text


func set_seconds(seconds: float) -> void:
	_time_label.text = MpRules.format_seconds(seconds)


func _make_group(icon_path: String, initial: int) -> Array:
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

	var label := MpUiKit.make_pixel_label(str(initial), MpUiKit.FONT_HUD)
	label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	group.add_child(label)

	return [group, label]
