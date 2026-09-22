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
var _loading := false


func _init() -> void:
	_request_consent()


func is_available() -> bool:
	return _ad != null


## 원본과 같이 RETRY 에서만 불린다. 준비된 광고가 없으면 조용히 넘어간다.
func show() -> bool:
	if _ad == null:
		return false
	_ad.show()
	return true


## 1단계. 동의 정보를 갱신한다. 실패해도 게임을 막지 않고 다음 단계로 넘어간다.
func _request_consent() -> void:
	var request := ConsentRequestParameters.new()
	request.tag_for_under_age_of_consent = false
	UserMessagingPlatform.consent_information.update(
		request,
		_on_consent_updated,
		func(_error: FormError) -> void: _initialize())


## 2단계. 동의 양식이 있고 아직 안 받았으면 띄운다.
func _on_consent_updated() -> void:
	var info := UserMessagingPlatform.consent_information
	if not info.get_is_consent_form_available():
		_initialize()
		return
	UserMessagingPlatform.load_consent_form(
		func(form: ConsentForm) -> void:
			if info.get_consent_status() != ConsentInformation.ConsentStatus.REQUIRED:
				_initialize()
				return
			form.show(func(_error: FormError) -> void: _initialize()),
		func(_error: FormError) -> void: _initialize())


## 3단계. 동의 상태가 정해진 뒤에만 SDK 를 켠다.
##
## 동의를 받지 못했으면 광고를 요청하지 않는다. is_available() 이 계속 false 라
## 게임은 광고 없이 그대로 돌아간다.
func _initialize() -> void:
	if _ready:
		return
	var status := UserMessagingPlatform.consent_information.get_consent_status()
	if status not in [
		ConsentInformation.ConsentStatus.NOT_REQUIRED,
		ConsentInformation.ConsentStatus.OBTAINED,
	]:
		return

	# 같은그림찾기는 전 연령 대상이다. 광고 등급을 그에 맞춘다.
	var config := RequestConfiguration.new()
	config.max_ad_content_rating = RequestConfiguration.MAX_AD_CONTENT_RATING_G
	MobileAds.set_request_configuration(config)

	_init_listener = OnInitializationCompleteListener.new()
	_init_listener.on_initialization_complete = (
		func(_status: InitializationStatus) -> void:
			_ready = true
			_load()
	)
	MobileAds.initialize(_init_listener)


## 4단계. 다음 RETRY 에 쓸 광고를 미리 받아 둔다.
func _load() -> void:
	if not _ready or _loading or _ad != null:
		return
	_loading = true
	# Poing v5.1.0은 AdRequest.extras를 Google 네트워크 extra로 보낸다.
	# npa=1은 Android와 iOS 모두 비개인화 광고만 요청한다. UMP 동의 흐름은 별개로 유지한다.
	var request := AdRequest.new()
	request.extras = {"npa": "1"}
	_load_callback = InterstitialAdLoadCallback.new()
	_load_callback.on_ad_loaded = func(ad: InterstitialAd) -> void:
		_loading = false
		_ad = ad
		_attach_content_callback(ad)
	_load_callback.on_ad_failed_to_load = func(_error: LoadAdError) -> void:
		# 재시도하지 않는다. 다음 판이 끝나면 어차피 다시 부른다.
		_loading = false
	_loader.load(_ad_unit_id(), request, _load_callback)


## 닫히거나 실패하면 네이티브 자원을 반드시 풀어 준다. 그러지 않으면 다음 광고가 샌다.
func _attach_content_callback(ad: InterstitialAd) -> void:
	_content_callback = FullScreenContentCallback.new()
	_content_callback.on_ad_dismissed_full_screen_content = func() -> void:
		_discard(ad)
	_content_callback.on_ad_failed_to_show_full_screen_content = func(_error: AdError) -> void:
		_discard(ad)
	ad.full_screen_content_callback = _content_callback


func _discard(ad: InterstitialAd) -> void:
	if _ad == ad:
		_ad = null
	ad.destroy()
	_load()


func _ad_unit_id() -> String:
	return IOS_AD_UNIT_ID if OS.get_name() == "iOS" else ANDROID_AD_UNIT_ID
