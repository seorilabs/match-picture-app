extends Node
## iOS 개인정보 조건을 실제 광고 어댑터에 주입해 요청과 늦은 콜백을 검증한다.
const Cases = preload("res://tests/release_stability.gd")
var _failures: Array[String] = []
var _checks := 0

class FakePrivacy:
	extends RefCounted
	signal authorization_finished(status: int)
	var status := 0
	var allows_ads := true
	var available := true
	var requests := 0
	func is_available() -> bool:
		return available
	func tracking_status() -> int:
		return status if available else -1
	func can_request_ads() -> bool:
		return available and allows_ads
	func request_tracking_authorization() -> bool:
		requests += 1
		return available
	func finish(value: int) -> void:
		status = value
		authorization_finished.emit(value)

class IosAds:
	extends Cases.FakeAdMob
	var privacy := FakePrivacy.new()
	var initializations := 0
	func _uses_ios_privacy() -> bool:
		return true
	func _privacy() -> Object:
		return privacy
	func _initialize_sdk() -> void:
		initializations += 1
		_on_initialized(null)

func _ready() -> void:
	_check_unresolved()
	_check_blocked()
	_check_authorized_and_withdrawn()
	_check_ump_and_errors()
	print("[ios-privacy] 검사 %d건, 실패 %d건" % [_checks, _failures.size()])
	for failure in _failures:
		printerr("[ios-privacy] 실패: " + failure)
	get_tree().quit(1 if not _failures.is_empty() else 0)

func _new_ads() -> IosAds:
	var ads := IosAds.new()
	ads._loader = Cases.FakeLoader.new()
	return ads

func _check_unresolved() -> void:
	var ads := _new_ads()
	ads._consent_busy = true
	ads.prepare()
	_check(ads.privacy.requests == 0, "UMP 양식 중 ATT 창을 요청하지 않는다")
	ads._finish_consent()
	ads.prepare()
	_check(ads.privacy.requests == 1, "미결정 ATT는 한 번 요청한다")
	_check(ads.initializations == 0 and ads._loader.calls == 0, "ATT 완료 전 광고 초기화·요청 없음")
	ads.privacy.finish(3)
	_check(ads.initializations == 1 and ads._loader.calls == 1, "허용 완료 뒤 초기화·광고 요청")
	_check(ads._loader.requests[0].extras == {"npa": "1"}, "허용해도 비개인화 요청 유지")
	ads.prepare()
	_check(ads._loader.calls == 1 and ads.privacy.requests == 1, "늦은 준비도 중복 요청 없음")

func _check_blocked() -> void:
	for status in [1, 2, -1]:
		var ads := _new_ads()
		ads.privacy.status = status
		ads._finish_consent()
		ads.prepare()
		_check(ads.initializations == 0 and ads._loader.calls == 0 and not ads.show(),
			"제한·거부·오류(%d) 광고 차단" % status)
		_check(ads.privacy.requests == 0, "결정된 상태에 ATT 반복 요청 없음")
	var missing := _new_ads()
	missing.privacy.available = false
	missing._finish_consent()
	_check(missing.initializations == 0 and missing._loader.calls == 0, "네이티브 연결 없음은 광고 차단")

func _check_authorized_and_withdrawn() -> void:
	var ads := _new_ads()
	ads.privacy.status = 3
	ads._finish_consent()
	var ad := Cases.FakeAd.new()
	ads._loader.callbacks[0].on_ad_loaded.call(ad)
	_check(ads.is_available(), "두 조건 통과 후 준비된 광고")
	ads.privacy.status = 2
	_check(not ads.show() and ad.shows == 0 and ad.destroyed, "표시 직전 권한 철회 광고 폐기")
	ads.privacy.status = 3
	ads.prepare()
	var late := Cases.FakeAd.new()
	ads.privacy.status = 2
	ads._on_application_resumed()
	ads.privacy.status = 3
	ads._loader.callbacks[1].on_ad_loaded.call(late)
	_check(late.destroyed and not ads.is_available() and ads._loader.calls == 3,
		"철회 뒤 재허용돼도 철회 전 늦은 광고 폐기")
	ads.privacy.status = 3
	ads.prepare()
	ads.show_privacy_options()
	ads.privacy_callback.call(null)
	var stale := Cases.FakeAd.new()
	ads._loader.callbacks[2].on_ad_loaded.call(stale)
	_check(stale.destroyed and ads._loader.calls == 4, "동의창 이전 늦은 결과 폐기 뒤 현재 조건 재확인")

func _check_ump_and_errors() -> void:
	var ads := _new_ads()
	ads.privacy.status = 3
	ads.privacy.allows_ads = false
	ads._finish_consent()
	_check(ads.initializations == 0 and ads._loader.calls == 0, "OBTAINED enum보다 실제 UMP canRequestAds 우선")
	ads.privacy.allows_ads = true
	ads._on_consent_update_failed(FormError.new(1, "QA error"))
	ads.prepare()
	_check(ads.initializations == 0 and ads._loader.calls == 0, "이번 동의 갱신 오류에서 광고 없이 진행")
	ads._finish_consent()
	_check(ads.initializations == 1 and ads._loader.calls == 1, "후속 정상 동의에서 복구")

func _check(value: bool, label: String) -> void:
	_checks += 1
	if not value:
		_failures.append(label)
