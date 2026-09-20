class_name MpGa4Analytics
extends MpAnalyticsPort
## GA4 Measurement Protocol 전송.
##
## 세 표면이 같은 코드로 같은 이벤트를 보낸다. 앱인토스 래퍼에 Firebase Web SDK 를 넣지
## 않는 이유가 여기 있다. 표면마다 다른 SDK 를 붙이면 이벤트가 갈라지고, 래퍼 번들에
## 클라이언트 키가 들어가는 것도 피하고 싶었다.
##
## 이벤트 이름과 파라미터는 코어(MpAnalyticsEvents)가 계약으로 가진다. 계약을 통과하지
## 못한 것은 내보내지 않는다. 오타 하나로 GA4 에 쓰레기 차원이 생기면 되돌리기 어렵다.
##
## 설정이 비면 조용히 아무것도 하지 않는다. 로컬 개발과 헤드리스 테스트가 그 상태다.

const CONFIG_PATH := "res://analytics.config.json"
const ENDPOINT := "https://www.google-analytics.com/mp/collect"
const CLIENT_ID_KEY := "analytics_client_id"

## GA4 는 이벤트당 파라미터 25개, 이름 40자까지 받는다. 우리 계약은 그보다 훨씬 작지만
## 넘겨서 조용히 버려지는 일이 없게 여기서 한 번 더 막는다.
const MAX_PARAMS := 25
const MAX_NAME_LENGTH := 40

var _measurement_id := ""
var _api_secret := ""
var _client_id := ""
var _http: HTTPRequest = null
var _queue: Array[Dictionary] = []
var _sending := false


## host 는 HTTPRequest 를 붙일 자리다. 계측이 트리에 매이는 유일한 지점이다.
func _init(host: Node) -> void:
	var config := _read_config()
	_measurement_id = String(config.get("measurement_id", ""))
	_api_secret = String(config.get("api_secret", ""))
	if not is_enabled():
		return

	_client_id = _resolve_client_id()
	_http = HTTPRequest.new()
	_http.timeout = 10.0
	_http.request_completed.connect(_on_request_completed)
	host.add_child(_http)


func is_enabled() -> bool:
	if _measurement_id.is_empty() or _api_secret.is_empty():
		return false
	return Platform.allows_sdk_calls()


func log_event(name: String, params: Dictionary) -> void:
	if not MpAnalyticsEvents.is_known(name):
		push_warning("계약에 없는 계측 이벤트라 버린다: %s" % name)
		return
	if not is_enabled():
		return
	if name.length() > MAX_NAME_LENGTH:
		push_warning("이벤트 이름이 GA4 상한을 넘는다: %s" % name)
		return

	var cleaned := MpAnalyticsEvents.sanitize(name, params)
	if cleaned.size() > MAX_PARAMS:
		push_warning("파라미터가 GA4 상한을 넘는다: %s" % name)
		return

	_queue.append({"name": name, "params": cleaned})
	_pump()


func record_error(message: String, context: Dictionary) -> void:
	var params := context.duplicate()
	# GA4 파라미터 값은 100자까지다. 넘으면 이벤트째로 버려진다.
	params["message"] = message.substr(0, 100)
	log_event(MpAnalyticsEvents.SCRIPT_ERROR, params)


## 한 번에 하나씩 보낸다. 계측이 게임 흐름을 막지 않아야 하므로 실패는 조용히 버린다.
func _pump() -> void:
	if _sending or _queue.is_empty() or _http == null:
		return

	var event: Dictionary = _queue.pop_front()
	var url := "%s?measurement_id=%s&api_secret=%s" % [
		ENDPOINT,
		_measurement_id.uri_encode(),
		_api_secret.uri_encode(),
	]
	var body := JSON.stringify({
		"client_id": _client_id,
		"events": [event],
	})
	var error := _http.request(url, ["Content-Type: application/json"], HTTPClient.METHOD_POST, body)
	if error != OK:
		return
	_sending = true


func _on_request_completed(_result: int, _code: int, _headers: PackedStringArray, _body: PackedByteArray) -> void:
	_sending = false
	_pump()


func _read_config() -> Dictionary:
	if not FileAccess.file_exists(CONFIG_PATH):
		return {}
	var file := FileAccess.open(CONFIG_PATH, FileAccess.READ)
	if file == null:
		return {}
	var raw := file.get_as_text()
	file.close()
	var json := JSON.new()
	if json.parse(raw) != OK:
		push_warning("analytics.config.json 을 읽지 못했다.")
		return {}
	return json.data if json.data is Dictionary else {}


## 설치마다 고정된 식별자. GA4 가 사용자를 세는 기준이라 매 실행 바뀌면 안 된다.
func _resolve_client_id() -> String:
	var stored: Variant = Save.get_value(CLIENT_ID_KEY, "")
	if stored is String and not String(stored).is_empty():
		return String(stored)
	var generated := "%d.%d" % [randi(), Time.get_unix_time_from_system()]
	Save.set_value(CLIENT_ID_KEY, generated)
	return generated
