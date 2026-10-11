extends Node
## MP-IOS-116의 저장·광고 실패와 실제 조립 경로 회귀.

var _failures: Array[String] = []
var _checks := 0

class FailingStorage:
	extends MpMemoryStorage
	var fail := false
	func write(data: Dictionary) -> bool:
		if fail:
			write_count += 1
			return false
		return super.write(data)

class FailedPromotion:
	extends MpFileStorage
	var fail_promotion := false
	func _rename_file(from: String, to: String) -> Error:
		if fail_promotion and from.ends_with(TMP_SUFFIX):
			return ERR_CANT_CREATE
		return DirAccess.rename_absolute(from, to)

class PartialWrite:
	extends MpFileStorage
	var truncate_write := false
	func _write_bytes(file: FileAccess, bytes: PackedByteArray) -> bool:
		return file.store_buffer(bytes.slice(0, int(bytes.size() / 2.0)) if truncate_write else bytes)

class FakeLoader:
	extends InterstitialAdLoader
	var calls := 0
	var callbacks: Array[InterstitialAdLoadCallback] = []
	var requests: Array[AdRequest] = []
	func load(_id: String, request: AdRequest,
		callback: InterstitialAdLoadCallback = InterstitialAdLoadCallback.new()) -> void:
		calls += 1
		callbacks.append(callback)
		requests.append(request)

class FakeAd:
	extends InterstitialAd
	var destroyed := false
	var shows := 0
	func _init() -> void:
		super(0)
	func show() -> void:
		shows += 1
	func destroy() -> void:
		destroyed = true

class FakeAdMob:
	extends MpAdMobInterstitialAds
	var status := ConsentInformation.ConsentStatus.OBTAINED
	var required := true
	var privacy_calls := 0
	var privacy_callback: Callable
	func _request_consent() -> void:
		pass
	func _consent_status() -> int:
		return status
	func _privacy_options_required() -> bool:
		return required
	func _present_privacy_options(callback: Callable) -> void:
		privacy_calls += 1
		privacy_callback = callback
	func _initialize_sdk() -> void:
		_ready = true
		_load()

class FakeAds:
	extends MpInterstitialAdPort
	var prepares := 0
	var shows := 0
	var required := false
	var busy := false
	var opening := false
	var requested := true
	func prepare() -> void:
		prepares += 1
	func is_available() -> bool:
		return true
	func show() -> bool:
		shows += 1
		return requested
	func is_privacy_options_required() -> bool:
		return required
	func is_privacy_options_busy() -> bool:
		return busy
	func is_privacy_options_opening() -> bool:
		return opening
	func show_privacy_options() -> bool:
		return required

class FakeAnalytics:
	extends MpAnalyticsPort
	var events: Array[Dictionary] = []
	func log_event(name: String, params: Dictionary) -> void:
		events.append({"name": name, "params": params.duplicate(true)})

class FakeLeaderboard:
	extends MpLeaderboardPort
	func is_available() -> bool:
		return true
	func submit_score(_score: int) -> Result:
		return Result.SUCCESS

func _ready() -> void:
	_check_save_transaction()
	_check_file_recovery()
	_check_ad_recovery()
	await _check_ui_and_events()
	print("[stability] 검사 %d건, 실패 %d건" % [_checks, _failures.size()])
	for failure in _failures:
		printerr("[stability] 실패: " + failure)
	get_tree().quit(1 if not _failures.is_empty() else 0)

func _check_save_transaction() -> void:
	var storage := FailingStorage.new()
	Save.use_storage(storage)
	Save.set_value("best_seconds", 24.6)
	var before := Save.snapshot()
	storage.fail = true
	_check(not Save.set_value("best_seconds", 20.0), "AC-1 쓰기 실패를 반환한다")
	_check(Save.snapshot() == before, "AC-1 실패하면 메모리 기록을 보존한다")
	_check(storage.read().get("best_seconds") == 24.6, "AC-1 디스크 기록도 보존한다")
	if not Save.has_method("set_values"):
		_check(false, "AC-1 여러 기록을 한 번에 저장하는 인터페이스")
		return
	storage.fail = false
	var writes := storage.write_count
	_check(Save.call("set_values", {"best_seconds": 20.0, "best_splits": [2.0], "clear_count": 1}),
		"AC-1 일괄 저장 성공")
	_check(storage.write_count == writes + 1, "AC-1 세 항목을 한 번 쓴다")
	before = Save.snapshot()
	storage.fail = true
	_check(not Save.call("set_values", {"best_seconds": 19.0, "clear_count": 2}), "AC-1 일괄 실패 반환")
	_check(Save.snapshot() == before, "AC-1 부분 기록을 남기지 않는다")

func _check_file_recovery() -> void:
	var partial_path := "user://mp116_partial_%d.save" % Time.get_ticks_usec()
	var partial := PartialWrite.new(partial_path)
	partial.write({"best_seconds": 24.6})
	partial.truncate_write = true
	_check(not partial.write({"best_seconds": 20.0}), "AC-1 부분 쓰기를 저장 성공으로 확정하지 않는다")
	_check(partial.read().get("best_seconds") == 24.6, "AC-1 부분 쓰기 실패 때 이전 정본 보존")
	for suffix in ["", MpFileStorage.BAK_SUFFIX, MpFileStorage.TMP_SUFFIX]:
		DirAccess.remove_absolute(ProjectSettings.globalize_path(partial_path + suffix))
	var path := "user://mp116_%d.save" % Time.get_ticks_usec()
	var storage := FailedPromotion.new(path)
	storage.write({"best_seconds": 24.6})
	storage.write({"best_seconds": 20.0})
	_break_file(path)
	_check(storage.read().get("best_seconds") == 24.6, "AC-1 정상 백업 복구")
	_check(storage.write({"best_seconds": 18.0}), "AC-1 손상 원본 뒤 새 기록 저장")
	_break_file(path)
	_check(storage.read().get("best_seconds") == 24.6, "AC-1 손상 원본으로 정상 백업을 덮지 않는다")
	storage.write({"best_seconds": 17.0})
	# 회전 대상이 디렉터리라 rename할 수 없을 때 정상 원본을 보존한다.
	DirAccess.remove_absolute(ProjectSettings.globalize_path(path + MpFileStorage.BAK_SUFFIX))
	DirAccess.make_dir_absolute(ProjectSettings.globalize_path(path + MpFileStorage.BAK_SUFFIX))
	_check(not storage.write({"best_seconds": 16.5}), "AC-1 백업 회전 실패 반환")
	_check(storage.read().get("best_seconds") == 17.0, "AC-1 회전 실패 시 정상 원본 보존")
	DirAccess.remove_absolute(ProjectSettings.globalize_path(path + MpFileStorage.BAK_SUFFIX))
	storage.fail_promotion = true
	_check(not storage.write({"best_seconds": 16.0}), "AC-1 최종 교체 실패 반환")
	_check(storage.read().get("best_seconds") == 17.0, "AC-1 교체 실패 후 이전 정상 기록 복구")
	for suffix in ["", MpFileStorage.BAK_SUFFIX, MpFileStorage.TMP_SUFFIX]:
		DirAccess.remove_absolute(ProjectSettings.globalize_path(path + suffix))

func _break_file(path: String) -> void:
	var file := FileAccess.open(path, FileAccess.WRITE)
	file.store_string("{ broken")
	file.close()

func _check_ad_recovery() -> void:
	var ads := FakeAdMob.new()
	var loader := FakeLoader.new()
	ads._loader = loader
	ads._ready = true
	if not ads.has_method("prepare"):
		_check(false, "AC-2 다음 판에서 광고를 재준비한다")
		return
	ads.call("prepare")
	ads.call("prepare")
	_check(loader.calls == 1, "AC-2 중복 로드 차단")
	_check(loader.requests[0].extras == {"npa": "1"}, "AC-3 비개인화 요청 유지")
	loader.callbacks[0].on_ad_failed_to_load.call(null)
	_check(loader.calls == 1, "AC-2 실패 직후 자동 반복 없음")
	ads.call("prepare")
	_check(loader.calls == 2, "AC-2 다음 판 완료 때 재요청")
	var stale := FakeAd.new()
	if not ads.has_method("show_privacy_options"):
		_check(false, "AC-3 개인정보 양식 재진입 인터페이스")
		return
	_check(ads.call("show_privacy_options"), "AC-3 개인정보 양식 요청")
	_check(not ads.call("show_privacy_options"), "AC-3 양식 중복 요청 차단")
	_check(ads.privacy_calls == 1, "AC-3 양식을 한 번 연다")
	loader.callbacks[1].on_ad_loaded.call(stale)
	_check(stale.destroyed and not ads.is_available(), "AC-3 동의 변경 전 늦은 광고 폐기")
	ads.status = ConsentInformation.ConsentStatus.REQUIRED
	ads.privacy_callback.call(null)
	ads.call("prepare")
	_check(loader.calls == 2 and not ads.is_available(), "AC-3 미완료 동의에서는 광고 요청 차단")
	ads.status = ConsentInformation.ConsentStatus.OBTAINED
	ads.call("prepare")
	_check(loader.calls == 3, "AC-3 현재 동의에서 다시 준비")
	var ad := FakeAd.new()
	loader.callbacks[2].on_ad_loaded.call(ad)
	_check(ads.show() and ad.shows == 1, "AC-2 준비된 광고 표시 요청")
	_check(not ads.show(), "AC-2 같은 광고 중복 표시 차단")
	ad.full_screen_content_callback.on_ad_dismissed_full_screen_content.call()
	_check(ad.destroyed and loader.calls == 4, "AC-2 닫힌 광고 해제와 다음 광고 준비")
	# 동의 양식이 옛 로드보다 먼저 닫혀도 Poing의 단일 콜백을 덮지 않는다.
	ads.call("show_privacy_options")
	ads.privacy_callback.call(null)
	ads.call("prepare")
	_check(loader.calls == 4, "AC-3 옛 로드 완료 전 새 콜백을 덮지 않는다")
	var late := FakeAd.new()
	loader.callbacks[3].on_ad_loaded.call(late)
	_check(late.destroyed and loader.calls == 5, "AC-3 늦은 결과 폐기 뒤 현재 동의로 준비")
	var failed_show := FakeAd.new()
	loader.callbacks[4].on_ad_loaded.call(failed_show)
	ads.show()
	failed_show.full_screen_content_callback.on_ad_failed_to_show_full_screen_content.call(null)
	_check(failed_show.destroyed and loader.calls == 6, "AC-2 표시 실패도 자원 해제")
	ads.required = false
	_check(not ads.call("show_privacy_options"), "AC-3 필요하지 않은 양식은 요청하지 않는다")

func _check_ui_and_events() -> void:
	var storage := FailingStorage.new()
	Save.use_storage(storage)
	Save.set_value("best_seconds", 24.6)
	var main: Node = load("res://scenes/main.tscn").instantiate()
	add_child(main)
	await get_tree().process_frame
	var ads := FakeAds.new()
	var analytics := FakeAnalytics.new()
	main.set("_ads", ads)
	main.set("_analytics", analytics)
	main.set("_leaderboard", FakeLeaderboard.new())
	var title: MpTitleScreen = main.get("_title")
	var settings: MpSettingsPopup = main.get("_settings")
	if title.has_signal("settings_pressed"):
		title.emit_signal("settings_pressed")
		_check(settings.visible and title.visible, "AC-3 시작 화면에서 설정 접근")
		Locale.set_language("en", false)
		await get_tree().process_frame
		_check(title.get("_best_label").text.contains("BEST"), "AC-3 시작 최고 기록도 즉시 번역")
		main.call("go_back")
		_check(not settings.visible and title.visible, "AC-3 뒤로가기로 시작 화면 복귀")
	else:
		_check(false, "AC-3 타이틀 설정 버튼")
	main.call("_start_game", false)
	main.call("_on_open_settings")
	var privacy_button := settings.get("_privacy_button") as Button
	_check(not privacy_button.visible, "AC-3 불필요한 개인정보 버튼 숨김")
	ads.required = true
	main.call("_refresh_privacy_options")
	_check(privacy_button.visible, "AC-3 늦게 결정된 필요 상태 반영")
	ads.busy = true
	main.call("_refresh_privacy_options")
	_check(privacy_button.disabled and privacy_button.text == "SETTINGS_AD_PRIVACY",
		"AC-3 초기 동의 갱신을 사용자 양식 열기로 표시하지 않는다")
	ads.opening = true
	main.call("_refresh_privacy_options")
	_check(privacy_button.text == "SETTINGS_AD_PRIVACY_OPENING", "AC-3 실제 양식 요청에만 열기 표시")
	ads.busy = false
	ads.opening = false
	ads.required = false
	main.call("_on_privacy_pressed")
	_check(not privacy_button.visible, "AC-3 요청 거절 때 최신 필요 상태로 버튼 갱신")
	ads.required = true
	settings.call("configure_privacy_options", true, true)
	_check(privacy_button.disabled, "AC-3 양식을 여는 동안 입력 차단")
	settings.call("finish_privacy_options", false)
	_check(settings.get("_privacy_error").visible, "AC-3 양식 오류 알림")
	main.call("go_back")
	main.call("_on_open_settings")
	_check(not settings.get("_privacy_error").visible and not privacy_button.disabled, "AC-3 재진입 오류 정리와 재시도")
	main.call("go_back")
	storage.fail = true
	var before := Save.snapshot()
	var writes := storage.write_count
	main.call("_on_game_finished", 20.0)
	var popup: MpResultPopup = main.get("_result_popup")
	_check(storage.write_count == writes + 1, "AC-1 실제 판 완료도 한 번 쓴다")
	_check(Save.snapshot() == before, "AC-1 결과에서 저장 실패해도 이전 기록 유지")
	var error_label := popup.get("_save_error_label") as Label
	_check(error_label != null and error_label.visible, "AC-1 결과에 짧은 실패 알림")
	_check(popup.get("_best_label").text != "RESULT_NEW_BEST", "AC-1 실패를 신기록 저장 성공으로 표시하지 않는다")
	_check(ads.prepares == 1, "AC-2 판 완료에서 광고 준비")
	_check(not analytics.events.any(func(event: Dictionary) -> bool:
		return event.name == MpAnalyticsEvents.NEW_BEST_RECORD), "AC-1 저장 실패 신기록 이벤트 없음")
	var original_surface := Platform.surface()
	for surface in [Platform.Surface.IOS, Platform.Surface.ANDROID]:
		Platform.set("_surface", surface)
		analytics.events.clear()
		main.call("_submit_score", 20.0)
		var market: String = "app_store" if surface == Platform.Surface.IOS else "google_play"
		_check(analytics.events[0].params.market == market, "AC-4 순위 시장 " + market)
		main.call("_on_retry")
		var event: Dictionary = analytics.events[1]
		_check(event.params.ad_platform == "admob" and event.params.result == "REQUESTED", "AC-4 AdMob 표시 요청 분류")
	ads.requested = false
	analytics.events.clear()
	main.call("_on_retry")
	_check(analytics.events[0].params.result == "SKIPPED", "AC-4 표시 요청 거절은 SKIPPED")
	_check(main.get("_game_screen").get("_game").state() == MpGameState.State.PLAYING, "AC-2 광고 거절이어도 다음 판 즉시 시작")
	Platform.set("_surface", original_surface)
	if Platform.has_method("market_for"):
		_check(Platform.call("market_for", Platform.Surface.WEB, true) == "ait", "AC-4 AIT 시장")
		_check(Platform.call("ad_provider_for", "ait") == "toss_ads", "AC-4 AIT 제공자")
		_check(Platform.call("market_for", Platform.Surface.HEADLESS, false) == "", "AC-4 미지원 시장을 추측하지 않는다")
	else:
		_check(false, "AC-4 실제 표면 시장 판정")
	main.queue_free()
	await get_tree().process_frame
	Locale.set_language("auto", false)

func _check(condition: bool, label: String) -> void:
	_checks += 1
	if not condition:
		_failures.append(label)
