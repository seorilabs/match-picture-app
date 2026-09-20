class_name MpCardView
extends Control
## 카드 한 장. 심볼 8개를 원본 앵커 자리에 흩뿌려 놓는다.
##
## 내부 좌표계를 항상 650x650 으로 고정하고 바깥에서 scale 만 준다. 그래야
## MpPlacement 의 앵커 값이 화면비와 무관하게 상수로 유지된다.

signal symbol_pressed(symbol: String)

var _buttons: Array[MpSymbolButton] = []
var _interactive := false


func _init() -> void:
	custom_minimum_size = Vector2(MpRules.CARD_SIZE, MpRules.CARD_SIZE)
	size = custom_minimum_size
	# pivot 은 0 으로 둔다. 카드 자체는 회전하지 않으므로 scale 후 좌상단이 position 과
	# 같아야 화면 배치 계산이 단순해진다.
	pivot_offset = Vector2.ZERO
	clip_contents = false
	mouse_filter = Control.MOUSE_FILTER_IGNORE

	# 원본의 흰 카드 바탕. 심볼보다 뒤에 있어야 하므로 가장 먼저 붙인다.
	var background := Panel.new()
	background.add_theme_stylebox_override("panel", MpUiKit.card_style())
	background.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	background.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(background)

	for i in MpRules.SYMBOLS_PER_CARD:
		var button := MpSymbolButton.new()
		button.symbol_pressed.connect(_on_symbol_pressed)
		# 자식 순서가 곧 그리는 순서다. 심볼이 겹쳤을 때 뒤에 그려진 쪽이 탭을 가져가는
		# 원본 동작을 맞추려고 앵커 순서대로 추가한다.
		add_child(button)
		_buttons.append(button)


## 카드를 다시 그린다. spots 는 MpPlacement 가 뽑은 자리·각도·배율이다.
func show_card(card: PackedStringArray, spots: Array[MpSymbolSpot], library: MpSymbolLibrary) -> void:
	for i in _buttons.size():
		var button := _buttons[i]
		if i >= card.size() or i >= spots.size():
			button.visible = false
			continue
		button.visible = true
		button.setup(card[i], library.texture(card[i]), spots[i])
		button.set_interactive(_interactive)


## 상대 카드는 탭을 받지 않는다. 원본도 내 카드에만 클릭을 열어 뒀다.
func set_interactive(value: bool) -> void:
	_interactive = value
	for button in _buttons:
		button.set_interactive(value)


func current_rotations() -> PackedFloat32Array:
	var rotations := PackedFloat32Array()
	for button in _buttons:
		rotations.append(rad_to_deg(button.rotation))
	return rotations


func pulse_symbol(symbol: String) -> void:
	var button := find_symbol(symbol)
	if button != null:
		button.pulse()


func start_hint(symbol: String) -> void:
	var button := find_symbol(symbol)
	if button != null:
		button.start_hint()


func stop_hints() -> void:
	for button in _buttons:
		button.stop_hint()


func find_symbol(symbol: String) -> MpSymbolButton:
	for button in _buttons:
		if button.symbol == symbol:
			return button
	return null


func _on_symbol_pressed(symbol: String) -> void:
	symbol_pressed.emit(symbol)
