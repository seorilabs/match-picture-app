class_name MpAdMobInterstitialAds
extends MpInterstitialAdPort
## Google AdMob 전면광고. Google Play 와 App Store 빌드가 쓴다.
##
## 원본 Unity 는 AdMob 으로 RETRY 때 전면광고를 띄웠는데 Godot 재구현에서 빠져 있었다.
## 앱인토스는 토스 광고 SDK 를 쓰므로 그쪽에는 MpAitInterstitialAds 가 꽂힌다.
##
## 광고를 요청하기 전에 UMP 동의를 먼저 받는다. 2020년 원본에는 없던 절차지만,
## 지금은 EEA 트래픽에 동의 수집이 없으면 정책 위반이다.
##
## 광고 단위 ID 는 APK 에 그대로 실려 나가는 공개 식별자다. 자격증명 카탈로그의
## app/match-picture-app/admob/public-identifiers 와 같은 값을 쓴다.

const ANDROID_AD_UNIT_ID := "ca-app-pub-9932778305312246/8323244087"
const IOS_AD_UNIT_ID := "ca-app-pub-9932778305312246/8756953389"

var _ad: InterstitialAd = null
var _loader := InterstitialAdLoader.new()
var _load_callback: InterstitialAdLoadCallback
var _content_callback: FullScreenContentCallback
var _init_listener: OnInitializationCompleteListener
var _ready := false
var _initializing := false
var _loading := false
var _showing := false
var _consent_busy := false
var _privacy_form_open := false
## 이전 동의로 시작한 로드 결과를 폐기하기 위한 세대.
var _generation := 0
var _ios_privacy: Object
var _tracking_requested := false
var _consent_failed := false
var _permission_granted := false


func _init() -> void:
	_request_consent()
	if _uses_ios_privacy():
		_connect_focus.call_deferred()


func prepare() -> void:
	_initialize()


func is_available() -> bool:
	return _ads_allowed() and _ad != null and not _showing and not _consent_busy


## 원본과 같이 Retry에서만 요청한다. 중복 요청이나 미완료 동의는 건너뛴다.
func show() -> bool:
	if not is_available():
		return false
	_showing = true
	_ad.show()
	return true


func is_privacy_options_required() -> bool:
	return _privacy_options_required()


func is_privacy_options_busy() -> bool:
	return _consent_busy


func is_privacy_options_opening() -> bool:
	return _privacy_form_open


func show_privacy_options() -> bool:
	if not is_privacy_options_required() or _consent_busy or _showing:
		return false
	_consent_busy = true
	_privacy_form_open = true
	_generation += 1
	if _ad != null:
		_ad.destroy()
		_ad = null
	# 진행 중인 로드는 완료 콜백까지 기다린다. Poing loader는 콜백을 하나만 보유하므로
	# 이를 덮고 병렬 로드를 시작하면 옛 동의의 결과를 새 콜백이 받을 수 있다.
	privacy_options_changed.emit()
	_present_privacy_options(_on_privacy_options_finished)
	return true


func _request_consent() -> void:
	_consent_busy = true
	var request := ConsentRequestParameters.new()
	request.tag_for_under_age_of_consent = false
	UserMessagingPlatform.consent_information.update(
		request, _on_consent_updated, _on_consent_update_failed)


func _on_consent_update_failed(error: FormError) -> void:
	_finish_consent(error != null)


func _on_consent_updated() -> void:
	privacy_options_changed.emit()
	var info := UserMessagingPlatform.consent_information
	if not info.get_is_consent_form_available() or _consent_status() != ConsentInformation.ConsentStatus.REQUIRED:
		_finish_consent()
		return
	UserMessagingPlatform.load_consent_form(_on_consent_form_loaded, _on_consent_update_failed)


func _on_consent_form_loaded(form: ConsentForm) -> void:
	form.show(_on_consent_update_failed)


func _finish_consent(failed: bool = false) -> void:
	_consent_failed = failed
	_consent_busy = false
	privacy_options_changed.emit()
	_initialize()


func _present_privacy_options(callback: Callable) -> void:
	UserMessagingPlatform.show_privacy_options_form(callback)


func _on_privacy_options_finished(error: FormError) -> void:
	_privacy_form_open = false
	_finish_consent(error != null)
	privacy_options_finished.emit(error == null)


func _privacy_options_required() -> bool:
	return UserMessagingPlatform.consent_information.get_privacy_options_requirement_status() == ConsentInformation.PrivacyOptionsRequirementStatus.REQUIRED


func _consent_status() -> int:
	return UserMessagingPlatform.consent_information.get_consent_status()


func _consent_allows_ads() -> bool:
	if _uses_ios_privacy():
		var privacy := _privacy()
		return not _consent_failed and privacy.is_available() and privacy.can_request_ads() and privacy.tracking_status() == MpIosAdPrivacy.AUTHORIZED
	# Android의 기존 동의 경로는 유지한다.
	return _consent_status() in [
		ConsentInformation.ConsentStatus.NOT_REQUIRED,
		ConsentInformation.ConsentStatus.OBTAINED,
	]


func _uses_ios_privacy() -> bool:
	return OS.get_name() == "iOS"


func _privacy() -> Object:
	if _ios_privacy == null:
		_ios_privacy = MpIosAdPrivacy.new()
	return _ios_privacy


func _maybe_request_tracking() -> void:
	if not _uses_ios_privacy() or _consent_busy or _consent_failed:
		return
	var privacy := _privacy()
	if not privacy.is_available():
		return
	if not privacy.authorization_finished.is_connected(_on_tracking_finished):
		privacy.authorization_finished.connect(_on_tracking_finished)
	if not _tracking_requested and privacy.can_request_ads() and privacy.tracking_status() == MpIosAdPrivacy.NOT_DETERMINED:
		_tracking_requested = privacy.request_tracking_authorization()


func _on_tracking_finished(_status: int) -> void:
	# 신호 인자보다 현재 OS/UMP 상태를 다시 읽는다. 늦은 신호로 권한을 복제하지 않는다.
	if _privacy().tracking_status() == MpIosAdPrivacy.NOT_DETERMINED:
		# 표시 실패·OS 미결정 완료는 다음 명시적 준비·활성화에서 재시도한다.
		# 이 콜백에서 즉시 재요청하는 반복을 피한다.
		_tracking_requested = false
		_ads_allowed()
		return
	_initialize()


func _connect_focus() -> void:
	var tree := Engine.get_main_loop() as SceneTree
	if tree != null and not tree.root.focus_entered.is_connected(_on_application_resumed):
		tree.root.focus_entered.connect(_on_application_resumed)


func _on_application_resumed() -> void:
	_initialize()


func _ads_allowed() -> bool:
	var allowed := not _consent_busy and _consent_allows_ads()
	if _permission_granted and not allowed:
		_generation += 1
	_permission_granted = allowed
	if not allowed and _ad != null:
		_ad.destroy()
		_ad = null
		_showing = false
	return allowed


func _initialize() -> void:
	_maybe_request_tracking()
	if _consent_busy or not _ads_allowed():
		return
	if _ready:
		_load()
	elif not _initializing:
		_initializing = true
		_initialize_sdk()


func _initialize_sdk() -> void:
	var config := RequestConfiguration.new()
	config.max_ad_content_rating = RequestConfiguration.MAX_AD_CONTENT_RATING_G
	MobileAds.set_request_configuration(config)
	_init_listener = OnInitializationCompleteListener.new()
	_init_listener.on_initialization_complete = _on_initialized
	MobileAds.initialize(_init_listener)


func _on_initialized(_status: InitializationStatus) -> void:
	_initializing = false
	_ready = true
	_load()


func _load() -> void:
	if not _ready or _loading or _ad != null or _consent_busy or not _ads_allowed():
		return
	_loading = true
	var request := AdRequest.new()
	# 비개인화 광고 요청을 Android와 iOS 모두 유지한다.
	request.extras = {"npa": "1"}
	_load_callback = InterstitialAdLoadCallback.new()
	_load_callback.on_ad_loaded = _on_ad_loaded.bind(_generation)
	_load_callback.on_ad_failed_to_load = _on_ad_failed_to_load.bind(_generation)
	_loader.load(_ad_unit_id(), request, _load_callback)


func _on_ad_loaded(ad: InterstitialAd, generation: int) -> void:
	_loading = false
	if generation != _generation or _consent_busy or not _ads_allowed():
		ad.destroy()
		_load()
		return
	_ad = ad
	_attach_content_callback(ad)


func _on_ad_failed_to_load(_error: LoadAdError, generation: int) -> void:
	_loading = false
	# 보통 실패는 다음 판 완료까지 기다린다. 동의 변경으로 폐기된 요청만 최신 상태에서 이어 간다.
	if generation != _generation:
		_load()


func _attach_content_callback(ad: InterstitialAd) -> void:
	_content_callback = FullScreenContentCallback.new()
	_content_callback.on_ad_dismissed_full_screen_content = _discard.bind(weakref(ad))
	_content_callback.on_ad_failed_to_show_full_screen_content = _on_ad_failed_to_show.bind(weakref(ad))
	ad.full_screen_content_callback = _content_callback


func _on_ad_failed_to_show(_error: AdError, ad_ref: WeakRef) -> void:
	_discard(ad_ref)


func _discard(ad_ref: WeakRef) -> void:
	var ad := ad_ref.get_ref() as InterstitialAd
	if ad == null or _ad != ad:
		return
	_ad = null
	_showing = false
	ad.destroy()
	_load()


func _ad_unit_id() -> String:
	return IOS_AD_UNIT_ID if OS.get_name() == "iOS" else ANDROID_AD_UNIT_ID
