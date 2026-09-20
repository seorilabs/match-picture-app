extends Node
## user:// 세이브 파사드.
##
## 원본 Unity 가 남기던 것은 PlayerPrefs["HasPlayed"] 하나뿐이었다. 여기에 베스트 기록과
## 설정을 더한다. 값 해석(신기록 판정 등)은 코어가 하고, 이 노드는 읽고 쓰기만 맡는다.

const SCHEMA_VERSION := 1

var _storage: MpStoragePort
var _data: Dictionary = {}


func _ready() -> void:
	_storage = MpFileStorage.new()
	_data = _storage.read()
	if _data.is_empty():
		_data = _defaults()


## 테스트가 저장 매체를 갈아끼울 수 있게 열어 둔다.
func use_storage(storage: MpStoragePort) -> void:
	_storage = storage
	_data = _storage.read()
	if _data.is_empty():
		_data = _defaults()


func get_value(key: String, fallback: Variant = null) -> Variant:
	return _data.get(key, fallback)


## 저장 실패는 삼키지 않고 호출한 쪽에 돌려준다. 이번 실행에서는 값이 이미 반영돼 있다.
func set_value(key: String, value: Variant) -> bool:
	_data[key] = value
	return _storage.write(_data)


func snapshot() -> Dictionary:
	return _data.duplicate(true)


func _defaults() -> Dictionary:
	return {
		"schema": SCHEMA_VERSION,
		"has_played": false,
		"best_seconds": 0.0,
		"clear_count": 0,
		"language": "auto",
		"muted": false,
	}
