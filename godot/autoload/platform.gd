extends Node
## 실행 표면 판정을 한 곳에 모은다.
##
## 어댑터가 "지금 어디서 도는가"를 각자 판정하면 표면이 늘 때마다 분기가 흩어진다.
## 광고·리더보드·공유·계측 어댑터는 전부 여기를 본다.

enum Surface {
	EDITOR,
	HEADLESS,
	WEB,
	ANDROID,
	IOS,
	DESKTOP,
}

var _surface: Surface = Surface.DESKTOP


func _ready() -> void:
	_surface = _detect()


func surface() -> Surface:
	return _surface


func is_web() -> bool:
	return _surface == Surface.WEB


func is_mobile() -> bool:
	return _surface == Surface.ANDROID or _surface == Surface.IOS


## 앱인토스는 토스 앱 WebView 안에서 도는 웹이다. 래퍼가 심어 둔 브리지의 유무로 가른다.
## 브라우저에서 그냥 열어 본 경우와 구분해야 광고·리더보드 호출이 헛돌지 않는다.
func is_ait() -> bool:
	if not is_web():
		return false
	return JavaScriptBridge.get_interface("__mpBridge") != null


## 헤드리스와 에디터에서는 SDK 호출을 전부 no-op 으로 돌린다.
func allows_sdk_calls() -> bool:
	return _surface != Surface.HEADLESS and _surface != Surface.EDITOR


func _detect() -> Surface:
	if OS.has_feature("editor"):
		return Surface.EDITOR
	if DisplayServer.get_name() == "headless":
		return Surface.HEADLESS
	match OS.get_name():
		"Web":
			return Surface.WEB
		"Android":
			return Surface.ANDROID
		"iOS":
			return Surface.IOS
		_:
			return Surface.DESKTOP
