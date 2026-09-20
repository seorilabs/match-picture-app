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


## 앱인토스 래퍼가 알려 주는 안전 영역. 브리지가 없으면 빈 Dictionary 다.
##
## 값은 CSS 뷰포트 픽셀이라 그대로 쓰면 안 된다. MpSafeArea 가 논리 뷰포트로 환산한다.
func ait_safe_area_payload() -> Dictionary:
	var bridge := _bridge()
	if bridge == null:
		return {}
	var payload: Variant = bridge.safeArea()
	return payload if payload is Dictionary else {}


## 앱인토스 래퍼가 걸어 둔 로딩 덮개를 걷는다. 첫 화면을 세운 뒤 한 번 부른다.
##
## 래퍼가 engine.startGame() 의 Promise 를 기다리지 않는 이유가 여기 있다. 그 Promise 는
## 게임이 실제로 화면을 세운 시점과 일치하지 않아서, 커스텀 Web 템플릿에서는 게임이
## 멀쩡히 도는데도 덮개가 남았다.
func notify_ait_ready() -> void:
	var bridge := _bridge()
	if bridge != null:
		bridge.notifyReady()


## 안드로이드 하드웨어 백을 래퍼에서 받아 게임으로 넘긴다.
##
## 웹에서는 NOTIFICATION_WM_GO_BACK_REQUEST 가 오지 않으므로 이 경로가 유일하다.
## 콜백 참조를 들고 있지 않으면 수거되어 눌러도 아무 일도 일어나지 않는다.
var _back_callback: JavaScriptObject = null


func set_ait_back_handler(handler: Callable) -> void:
	var bridge := _bridge()
	if bridge == null:
		return
	_back_callback = JavaScriptBridge.create_callback(func(_args: Array) -> void: handler.call())
	bridge.setBackHandler(_back_callback)


func _bridge() -> JavaScriptObject:
	if not is_ait():
		return null
	return JavaScriptBridge.get_interface("__mpBridge")


## 헤드리스와 에디터에서는 SDK 호출을 전부 no-op 으로 돌린다.
func allows_sdk_calls() -> bool:
	return _surface != Surface.HEADLESS and _surface != Surface.EDITOR


func _detect() -> Surface:
	# headless 판정이 editor 보다 먼저다. CI 와 로컬 테스트는 에디터 바이너리를
	# --headless 로 돌리므로, 순서를 바꾸면 헤드리스가 EDITOR 로 잡힌다.
	if DisplayServer.get_name() == "headless":
		return Surface.HEADLESS
	if OS.has_feature("editor"):
		return Surface.EDITOR
	match OS.get_name():
		"Web":
			return Surface.WEB
		"Android":
			return Surface.ANDROID
		"iOS":
			return Surface.IOS
		_:
			return Surface.DESKTOP
