class_name MpIosAdPrivacy
extends RefCounted
## OS와 UMP가 소유하는 상태를 읽는 iOS 어댑터. 식별자와 동의 사본은 저장하지 않는다.
signal authorization_finished(status: int)
const NOT_DETERMINED := 0
const AUTHORIZED := 3
const UNAVAILABLE := -1
const SINGLETON := "MatchAdPrivacy"
var _native: Object

func _init() -> void:
	if Engine.has_singleton(SINGLETON):
		var candidate := Engine.get_singleton(SINGLETON)
		if candidate.has_method("tracking_status") and candidate.has_method("can_request_ads") and candidate.has_method("request_tracking_authorization") and candidate.has_signal("authorization_finished"):
			_native = candidate
			_native.authorization_finished.connect(_on_finished)

func is_available() -> bool:
	return is_instance_valid(_native)

func tracking_status() -> int:
	return int(_native.tracking_status()) if is_available() else UNAVAILABLE

func can_request_ads() -> bool:
	return is_available() and bool(_native.can_request_ads())

func request_tracking_authorization() -> bool:
	return is_available() and bool(_native.request_tracking_authorization())

func _on_finished(status: int) -> void:
	authorization_finished.emit(status)
