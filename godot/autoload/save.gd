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


## 저장 성공 후에만 메모리에 반영한다. 한 키도 일괄 저장과 같은 경로를 쓴다.
func set_value(key: String, value: Variant) -> bool:
	return set_values({key: value})


func set_values(values: Dictionary) -> bool:
	var candidate := _data.duplicate(true)
	candidate.merge(values.duplicate(true), true)
	if not _storage.write(candidate):
		return false
	_data = candidate
	return true


func snapshot() -> Dictionary:
	return _data.duplicate(true)


func _defaults() -> Dictionary:
	return {
		"schema": SCHEMA_VERSION,
		"has_played": false,
		"best_seconds": 0.0,
		"best_splits": [],
		"clear_count": 0,
		"language": "auto",
		"muted": false,
	}
