class_name MpSymbolButton
extends TextureButton
## 카드 위 심볼 하나.
##
## 원본 `Assets/Scripts/UI/UIButtonSymbol.cs` 의 연출을 옮겼다. 정답 펄스와 힌트 흔들림
## 모두 원본은 프레임 단위로 값을 더했지만, 프레임레이트에 매이지 않게 Tween 으로 바꿨다.

signal symbol_pressed(symbol: String)

## 힌트가 한 번 흔들리는 동안 좌우로 움직이는 거리.
const HINT_SHAKE_OFFSET := 10.0

## 흔들림 한 번에 좌우를 오가는 횟수. 0.5초를 이만큼으로 나눠 쓴다.
const HINT_SHAKE_CYCLES := 5

## 흔들림이 끝나고 다음 흔들림까지 쉬는 시간. 원본은 약 10.5초 주기로 반복했다.
const HINT_REST_SECONDS := MpRules.HINT_DELAY_SECONDS

var symbol := ""

var _base_position := Vector2.ZERO
var _base_scale := Vector2.ONE
var _pulse_tween: Tween
var _hint_tween: Tween


func _init() -> void:
	# 원본은 심볼 이미지의 사각 영역 전체를 판정 범위로 썼다. 알파 마스크를 쓰면
	# 원본보다 쉬워지므로 그대로 사각으로 둔다.
	stretch_mode = TextureButton.STRETCH_SCALE
	ignore_texture_size = true
	custom_minimum_size = Vector2(MpRules.SYMBOL_SIZE, MpRules.SYMBOL_SIZE)
	size = custom_minimum_size
	pivot_offset = custom_minimum_size / 2.0
	focus_mode = Control.FOCUS_NONE
	pressed.connect(_on_pressed)


## 카드 중심 기준 좌표를 카드 좌표계의 좌상단 기준으로 옮겨 배치한다.
func setup(p_symbol: String, texture: Texture2D, spot: MpSymbolSpot) -> void:
	symbol = p_symbol
	texture_normal = texture
	_base_position = Vector2(MpRules.CARD_SIZE, MpRules.CARD_SIZE) / 2.0 + spot.offset - pivot_offset
	_base_scale = Vector2(spot.scale, spot.scale)
	position = _base_position
	rotation = deg_to_rad(spot.rotation_degrees)
	scale = _base_scale
	stop_hint()


func set_interactive(value: bool) -> void:
	disabled = not value
	mouse_filter = Control.MOUSE_FILTER_STOP if value else Control.MOUSE_FILTER_IGNORE


## 원본의 정답 연출. 1 → 2 → 1 로 부풀었다 돌아온다.
func pulse() -> void:
	stop_hint()
	if _pulse_tween != null and _pulse_tween.is_valid():
		_pulse_tween.kill()
	var half := MpRules.CORRECT_PULSE_SECONDS / 2.0
	_pulse_tween = create_tween()
	_pulse_tween.tween_property(self, "scale", _base_scale * MpRules.CORRECT_PULSE_SCALE, half)
	_pulse_tween.tween_property(self, "scale", _base_scale, half)


## 정답 심볼이 좌우로 흔들린다. 0.5초 흔들고 10초 쉬는 것을 정답까지 반복한다.
func start_hint() -> void:
	if _hint_tween != null and _hint_tween.is_valid():
		return
	_hint_tween = create_tween()
	_hint_tween.set_loops()
	var step := MpRules.HINT_SHAKE_SECONDS / float(HINT_SHAKE_CYCLES * 2)
	for i in HINT_SHAKE_CYCLES:
		_hint_tween.tween_property(self, "position:x", _base_position.x + HINT_SHAKE_OFFSET, step)
		_hint_tween.tween_property(self, "position:x", _base_position.x - HINT_SHAKE_OFFSET, step)
	_hint_tween.tween_property(self, "position:x", _base_position.x, step)
	_hint_tween.tween_interval(HINT_REST_SECONDS)


func stop_hint() -> void:
	if _hint_tween != null and _hint_tween.is_valid():
		_hint_tween.kill()
	_hint_tween = null
	position = _base_position


func _on_pressed() -> void:
	symbol_pressed.emit(symbol)
