extends Node
## 실제 Editor Run 검수용. 저장과 외부 SDK만 격리하고 제품 화면·입력을 그대로 쓴다.
## F1: UMP 진입 필요 상태, F2: 저장 실패, F3/F4: 양식 성공/실패 콜백.
## F7: 이번 화면 캡처. F8: 원래 저장된 기록으로 타이틀에 복귀.
const Cases = preload("res://tests/release_stability.gd")
const PrivacyCases = preload("res://tests/ios_ad_privacy.gd")
var _storage := Cases.FailingStorage.new()
var _ads := PrivacyCases.IosAds.new()
var _main: Node

func _ready() -> void:
	Save.use_storage(_storage)
	Save.set_values({"best_seconds": 24.6, "clear_count": 3})
	_ads.required = false
	_ads._loader = Cases.FakeLoader.new()
	_ads._finish_consent()
	_main = load("res://scenes/main.tscn").instantiate()
	add_child(_main)
	var previous: MpInterstitialAdPort = _main.get("_ads")
	previous.privacy_options_changed.disconnect(_main._refresh_privacy_options)
	previous.privacy_options_finished.disconnect(_main.get("_settings").finish_privacy_options)
	_main.set("_ads", _ads)
	_ads.privacy_options_changed.connect(_main._refresh_privacy_options)
	_ads.privacy_options_finished.connect(_main.get("_settings").finish_privacy_options)
	print("[review] Editor Run / in-memory storage / fake SDK callbacks")
	# 같은 씬을 품질 게이트에서 로드해 파싱·조립 실패도 잡는다. 실제 UI 검수는 별도다.
	if DisplayServer.get_name() == "headless":
		await get_tree().process_frame
		_main.queue_free()
		await get_tree().process_frame
		get_tree().quit()

func _input(event: InputEvent) -> void:
	if not event is InputEventKey or not event.pressed or event.echo:
		return
	match event.keycode:
		KEY_F1:
			_ads.required = not _ads.required
			_ads.privacy_options_changed.emit()
			print("[review] privacy required=", _ads.required)
		KEY_F2:
			_storage.fail = not _storage.fail
			print("[review] storage failure=", _storage.fail)
		KEY_F3, KEY_F4:
			if _ads.privacy_callback.is_valid() and _ads.is_privacy_options_busy():
				_ads.privacy_callback.call(null if event.keycode == KEY_F3 else FormError.new(1, "QA simulated form failure"))
				print("[review] privacy success=", event.keycode == KEY_F3)
		KEY_F5, KEY_F6:
			_ads.privacy.finish(3 if event.keycode == KEY_F5 else 2)
			_print_privacy_state()
		KEY_F9:
			_ads.privacy.allows_ads = not _ads.privacy.allows_ads
			_ads.prepare()
			_print_privacy_state()
		KEY_F10:
			_ads._on_application_resumed()
			_print_privacy_state()
		KEY_F12:
			if _ads._showing and _ads._ad != null:
				_ads._ad.full_screen_content_callback.on_ad_dismissed_full_screen_content.call()
			elif _ads._loading:
				_ads._loader.callbacks.back().on_ad_loaded.call(Cases.FakeAd.new())
			_print_privacy_state()
		KEY_F7:
			_capture()
		KEY_F8:
			_main.get("_result_popup").hide_result()
			_main.get("_tutorial").visible = false
			_main.get("_settings").dismiss()
			_main.get("_title").show_title(
				float(Save.get_value("best_seconds", 0.0)), int(Save.get_value("clear_count", 0)))

func _capture() -> void:
	await RenderingServer.frame_post_draw
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path("res://build/review"))
	var path := "res://build/review/capture-%d.png" % Time.get_ticks_msec()
	var error := get_viewport().get_texture().get_image().save_png(path)
	print("[review] capture=", path, " result=", error)

func _print_privacy_state() -> void:
	print("[review] ATT=%d UMP=%s ATT-requests=%d SDK-inits=%d ad-loads=%d ready=%s" % [
		_ads.privacy.status, _ads.privacy.allows_ads, _ads.privacy.requests,
		_ads.initializations, _ads._loader.calls, _ads.is_available()])
