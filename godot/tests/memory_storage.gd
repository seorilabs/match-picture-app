class_name MpMemoryStorage
extends MpStoragePort
## 테스트용 인메모리 저장소.
##
## 통합 스모크가 개발자의 실제 user:// 기록을 덮어쓰지 않게 한다.

var _data: Dictionary = {}
var write_count := 0


func read() -> Dictionary:
	return _data.duplicate(true)


func write(data: Dictionary) -> bool:
	_data = data.duplicate(true)
	write_count += 1
	return true
