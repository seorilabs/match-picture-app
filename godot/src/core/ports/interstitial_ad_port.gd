class_name MpInterstitialAdPort
extends RefCounted
## 전면광고 추상.
##
## 원본 Unity 는 RETRY 버튼을 눌렀을 때만 전면광고를 띄웠다. 빈도 캡이나 세션 면제 같은
## 장치는 두지 않는다. 광고가 준비되지 않았거나 표면이 지원하지 않으면 조용히 넘어간다.


signal privacy_options_changed()
signal privacy_options_finished(success: bool)


## 다음 Retry에 쓸 광고를 준비한다. 미지원 표면에서는 아무 일도 하지 않는다.
func prepare() -> void:
	pass


func is_available() -> bool:
	return false


## 표시 요청을 전달했으면 true. 실제 노출 성공을 뜻하지 않는다. 게임 흐름은 반환값과 무관하게 이어져야 한다.
func show() -> bool:
	return false


func is_privacy_options_required() -> bool:
	return false


func is_privacy_options_busy() -> bool:
	return false


func show_privacy_options() -> bool:
	return false
