extends Node
## 조립 루트.
##
## 화면 부품을 만들어 붙이고, 포트 구현을 주입하고, 뒤로가기 우선순위를 가진다.
## 게임 규칙은 src/core/ 가, SDK 호출은 src/platform/ 이 가진다. 여기에 쌓지 않는다.

const HAS_PLAYED_KEY := "has_played"

var _library := MpSymbolLibrary.new()
var _analytics: MpAnalyticsPort
var _ads: MpInterstitialAdPort
var _leaderboard: MpLeaderboardPort
var _share: MpSharePort
var _retry_count := 0
var _safe_area_root: MarginContainer
var _game_screen: MpGameScreen
var _result_popup: MpResultPopup
var _tutorial: MpTutorialOverlay
var _quit_confirm: MpQuitConfirm
var _settings: MpSettingsPopup


func _ready() -> void:
	# 어댑터를 가장 먼저 세운다. 세이브를 읽거나 화면을 만들면서 나가는 이벤트가
	# 보낼 곳이 없어 조용히 사라지는 일을 막는다.
	_install_adapters()

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

	var has_played := bool(Save.get_value(HAS_PLAYED_KEY, false))
	var best := float(Save.get_value(MpBestRecord.BEST_KEY, MpBestRecord.NO_RECORD))
	_analytics.log_event(MpAnalyticsEvents.GAME_OPEN, {
		"has_played": has_played,
		"has_best": MpBestRecord.has_record(best),
	})

	# 원본은 최초 실행에만 설명을 보여 주고, 닫으면 그때 판을 시작했다.
	if has_played:
		_start_game(false)
	else:
		_analytics.log_event(MpAnalyticsEvents.TUTORIAL_BEGIN, {})
		_tutorial.show_overlay()

	# 앱인토스에서는 하드웨어 백이 래퍼를 거쳐 들어온다.
	Platform.set_ait_back_handler(go_back)
	# 첫 화면이 섰으니 래퍼의 로딩 덮개를 걷는다.
	Platform.notify_ait_ready()


## 표면이 지원하지 않는 기능은 포트 기본 구현(no-op)이 그대로 맡는다.
## 화면 쪽은 is_available() 만 보고 버튼을 그릴지 정한다.
func _install_adapters() -> void:
	_analytics = MpGa4Analytics.new(self)
	if Platform.is_ait():
		_ads = MpAitInterstitialAds.new()
		_leaderboard = MpAitLeaderboard.new()
		_share = MpAitShare.new()
	else:
		_ads = MpInterstitialAdPort.new()
		_leaderboard = MpLeaderboardPort.new()
		_share = MpSharePort.new()


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
	_result_popup.share_pressed.connect(_on_share)
	_result_popup.leaderboard_pressed.connect(_on_open_leaderboard)
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
	_analytics.log_event(MpAnalyticsEvents.TUTORIAL_COMPLETE, {})
	_start_game(false)


func _start_game(is_retry: bool) -> void:
	_analytics.log_event(MpAnalyticsEvents.LEVEL_START, {
		"deck_size": MpRules.TOTAL_CARDS,
		"is_retry": is_retry,
	})
	_game_screen.start_new_game()


func _on_game_finished(seconds: float) -> void:
	var best := float(Save.get_value(MpBestRecord.BEST_KEY, MpBestRecord.NO_RECORD))
	var is_new_best := MpBestRecord.is_new_best(seconds, best)

	_analytics.log_event(MpAnalyticsEvents.LEVEL_END, {
		"success": true,
		"seconds": int(seconds),
		"wrong_count": _game_screen.wrong_count(),
	})

	var merged := MpBestRecord.merge(Save.snapshot(), seconds)
	for key in [MpBestRecord.BEST_KEY, MpBestRecord.CLEAR_COUNT_KEY]:
		Save.set_value(key, merged[key])

	if is_new_best:
		_analytics.log_event(MpAnalyticsEvents.NEW_BEST_RECORD, {
			"seconds": int(seconds),
			"previous_seconds": int(best),
		})

	_submit_score(seconds)
	_result_popup.show_result(seconds, best, is_new_best, _leaderboard.is_available(), _share.is_available())


## 기록은 끝날 때마다 올린다. 게임센터가 더 좋은 기록만 남긴다.
func _submit_score(seconds: float) -> void:
	if not _leaderboard.is_available():
		return
	var score := MpBestRecord.to_leaderboard_score(seconds)
	var result := _leaderboard.submit_score(score)
	if result == MpLeaderboardPort.Result.SUCCESS:
		_analytics.log_event(MpAnalyticsEvents.POST_SCORE, {"score": score, "market": "ait"})


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


## 원본은 RETRY 를 눌렀을 때만 전면광고를 띄웠다. 빈도 캡은 두지 않는다.
func _on_retry() -> void:
	_result_popup.hide_result()
	_retry_count += 1
	if _ads.is_available():
		var shown := _ads.show()
		_analytics.log_event(MpAnalyticsEvents.INTERSTITIAL_AD_IMPRESSION, {
			"ad_platform": "toss_ads",
			"result": "SHOWN" if shown else "SKIPPED",
		})
	_start_game(true)


func _on_share() -> void:
	var seconds := _game_screen.last_seconds()
	var message := tr("SHARE_MESSAGE").format([MpRules.format_seconds(seconds)])
	var result := _share.share_record(message)
	_analytics.log_event(MpAnalyticsEvents.SHARE, {
		"method": "text",
		"result": MpSharePort.Result.keys()[result],
	})


func _on_open_leaderboard() -> void:
	var result := _leaderboard.open_board()
	_analytics.log_event(MpAnalyticsEvents.LEADERBOARD_OPEN, {
		"result": MpLeaderboardPort.Result.keys()[result],
	})


func _on_open_settings() -> void:
	_settings.show_settings()


func _on_request_quit() -> void:
	_quit_confirm.show_confirm()


func _on_quit_confirmed() -> void:
	get_tree().quit()
