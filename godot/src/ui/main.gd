extends Node
## 조립 루트.
##
## 화면 부품을 만들어 붙이고, 포트 구현을 주입하고, 뒤로가기 우선순위를 가진다.
## 게임 규칙은 src/core/ 가, SDK 호출은 src/platform/ 이 가진다. 여기에 쌓지 않는다.

const HAS_PLAYED_KEY := "has_played"

var _library := MpSymbolLibrary.new()
var _safe_area_root: MarginContainer
var _game_screen: MpGameScreen
var _result_popup: MpResultPopup
var _tutorial: MpTutorialOverlay
var _quit_confirm: MpQuitConfirm
var _settings: MpSettingsPopup


func _ready() -> void:
	var loaded := _library.load_all()
	if loaded < MpRules.SYMBOL_POOL_SIZE:
		push_warning("심볼 텍스처가 %d장만 올라왔다. 기대 %d장." % [loaded, MpRules.SYMBOL_POOL_SIZE])

	_build_background()
	_build_game_layer()
	_build_overlays()

	var window := get_window()
	if window != null:
		window.size_changed.connect(_apply_safe_area)
	_apply_safe_area()

	if OS.is_debug_build():
		print("[ui] ", MpSafeArea.describe(window))

	# 원본은 최초 실행에만 설명을 보여 주고, 닫으면 그때 판을 시작했다.
	if bool(Save.get_value(HAS_PLAYED_KEY, false)):
		_game_screen.start_new_game()
	else:
		_tutorial.show_overlay()


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


func _build_game_layer() -> void:
	var layer := CanvasLayer.new()
	add_child(layer)

	# HUD 는 위 노치에, 내 카드는 아래 제스처 바에 걸린다. 게임 화면만 여백 안으로 넣는다.
	_safe_area_root = MarginContainer.new()
	_safe_area_root.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_safe_area_root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	layer.add_child(_safe_area_root)

	_game_screen = MpGameScreen.new(_library)
	_game_screen.finished.connect(_on_game_finished)
	_safe_area_root.add_child(_game_screen)


func _build_overlays() -> void:
	var layer := CanvasLayer.new()
	layer.layer = 2
	add_child(layer)

	_result_popup = MpResultPopup.new()
	_result_popup.retry_pressed.connect(_on_retry)
	_result_popup.settings_pressed.connect(_on_open_settings)
	_result_popup.exit_pressed.connect(_on_request_quit)
	layer.add_child(_result_popup)

	_tutorial = MpTutorialOverlay.new()
	_tutorial.closed.connect(_on_tutorial_closed)
	layer.add_child(_tutorial)

	_settings = MpSettingsPopup.new()
	layer.add_child(_settings)

	_quit_confirm = MpQuitConfirm.new()
	_quit_confirm.confirmed.connect(_on_quit_confirmed)
	layer.add_child(_quit_confirm)


func _apply_safe_area() -> void:
	if _safe_area_root == null:
		return
	var insets := MpSafeArea.insets(get_window())
	_safe_area_root.add_theme_constant_override("margin_left", int(insets.x))
	_safe_area_root.add_theme_constant_override("margin_top", int(insets.y))
	_safe_area_root.add_theme_constant_override("margin_right", int(insets.z))
	_safe_area_root.add_theme_constant_override("margin_bottom", int(insets.w))


## 원본 Update() 의 뒤로가기 우선순위를 그대로 옮겼다. 설정은 나중에 생긴 화면이라
## 가장 위에 둔다. project.godot 의 quit_on_go_back 을 꺼 둬야 여기로 들어온다.
func _notification(what: int) -> void:
	if what != NOTIFICATION_WM_GO_BACK_REQUEST:
		return
	go_back()


## 앱인토스 래퍼도 안드로이드 하드웨어 백을 받아 이 함수를 부른다.
func go_back() -> void:
	if _settings != null and _settings.visible:
		_settings.dismiss()
		return
	if _quit_confirm != null and _quit_confirm.visible:
		_quit_confirm.dismiss()
		return
	if _tutorial != null and _tutorial.visible:
		_tutorial.visible = false
		_on_tutorial_closed()
		return
	_quit_confirm.show_confirm()


func _on_tutorial_closed() -> void:
	Save.set_value(HAS_PLAYED_KEY, true)
	_game_screen.start_new_game()


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


func show_overlay_for_capture(name: String) -> void:
	# 오버레이를 하나씩 깨끗한 상태에서 찍기 위해 결과 화면을 먼저 내린다.
	_result_popup.hide_result()
	match name:
		"tutorial":
			_tutorial.show_overlay()
		"settings":
			_settings.show_settings()
		"quit":
			_quit_confirm.show_confirm()


func _on_retry() -> void:
	_result_popup.hide_result()
	_game_screen.start_new_game()


func _on_open_settings() -> void:
	_settings.show_settings()


func _on_request_quit() -> void:
	_quit_confirm.show_confirm()


func _on_quit_confirmed() -> void:
	get_tree().quit()
