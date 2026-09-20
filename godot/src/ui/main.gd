extends Node
## 조립 루트.
##
## 화면 부품을 만들어 붙이고, 포트 구현을 주입하고, 뒤로가기 우선순위를 가진다.
## 게임 규칙은 src/core/ 가, SDK 호출은 src/platform/ 이 가진다. 여기에 쌓지 않는다.

var _library := MpSymbolLibrary.new()
var _game_screen: MpGameScreen
var _result_popup: MpResultPopup


func _ready() -> void:
	var loaded := _library.load_all()
	if loaded < MpRules.SYMBOL_POOL_SIZE:
		push_warning("심볼 텍스처가 %d장만 올라왔다. 기대 %d장." % [loaded, MpRules.SYMBOL_POOL_SIZE])

	_build_background()

	var layer := CanvasLayer.new()
	add_child(layer)

	_game_screen = MpGameScreen.new(_library)
	_game_screen.finished.connect(_on_game_finished)
	layer.add_child(_game_screen)

	var overlay := CanvasLayer.new()
	overlay.layer = 2
	add_child(overlay)

	_result_popup = MpResultPopup.new()
	_result_popup.retry_pressed.connect(_on_retry)
	_result_popup.exit_pressed.connect(_on_exit)
	overlay.add_child(_result_popup)

	_game_screen.start_new_game()


func _build_background() -> void:
	var layer := CanvasLayer.new()
	layer.layer = -1
	add_child(layer)

	var background := TextureRect.new()
	background.texture = MpUiKit.background_texture()
	background.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	background.stretch_mode = TextureRect.STRETCH_SCALE
	background.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	background.mouse_filter = Control.MOUSE_FILTER_IGNORE
	layer.add_child(background)


func _on_game_finished(seconds: float) -> void:
	var best := float(Save.get_value(MpBestRecord.BEST_KEY, MpBestRecord.NO_RECORD))
	var is_new_best := MpBestRecord.is_new_best(seconds, best)

	var merged := MpBestRecord.merge(Save.snapshot(), seconds)
	for key in [MpBestRecord.BEST_KEY, MpBestRecord.CLEAR_COUNT_KEY]:
		Save.set_value(key, merged[key])

	_result_popup.show_result(seconds, best, is_new_best)


## tests/capture_screens.gd 가 결과 화면을 같은 비율에서 찍기 위해 쓴다.
## 실제 판을 끝까지 돌리지 않고 팝업만 띄운다.
func show_result_for_capture(seconds: float, best_seconds: float, is_new_best: bool) -> void:
	_result_popup.show_result(seconds, best_seconds, is_new_best)


func _on_retry() -> void:
	_result_popup.hide_result()
	_game_screen.start_new_game()


func _on_exit() -> void:
	get_tree().quit()
