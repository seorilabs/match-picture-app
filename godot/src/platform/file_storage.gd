class_name MpFileStorage
extends MpStoragePort
## user:// 에 JSON 한 덩어리로 저장한다.
##
## 쓰기는 tmp 에 전부 쓴 뒤 rename 하고 직전 내용을 .bak 한 세대만 남긴다.
## 게임 도중 앱이 죽어도 반쯤 쓰인 파일이 정본 자리에 남지 않게 하기 위해서다.

const SAVE_PATH := "user://match_picture.save"
const TMP_SUFFIX := ".tmp"
const BAK_SUFFIX := ".bak"

var _path: String


func _init(path: String = SAVE_PATH) -> void:
	_path = path


func read() -> Dictionary:
	var data := _read_json(_path)
	if not data.is_empty():
		return data
	# 정본이 손상됐으면 직전 세대로 되돌린다.
	return _read_json(_path + BAK_SUFFIX)


func write(data: Dictionary) -> bool:
	var tmp_path := _path + TMP_SUFFIX
	var tmp := FileAccess.open(tmp_path, FileAccess.WRITE)
	if tmp == null:
		push_warning("세이브 임시 파일을 열지 못했다: %s" % error_string(FileAccess.get_open_error()))
		return false
	var bytes := JSON.stringify(data).to_utf8_buffer()
	var wrote := _write_bytes(tmp, bytes)
	tmp.flush()
	var write_error := tmp.get_error()
	# flush 자체는 일부 플랫폼에서 오류를 갱신하지 않는다. 실제 바이트 수도 확인한다.
	var complete := tmp.get_length() == bytes.size()
	tmp.close()
	if not wrote or write_error != OK or not complete:
		return false

	# 복구한 정상 백업을 손상된 원본으로 덮지 않는다. 회전 실패면 원본을 보존한다.
	if not _read_json(_path).is_empty():
		if _rename_file(_path, _path + BAK_SUFFIX) != OK:
			return false
	# 여기서 실패해도 정상 원본 또는 .bak 을 read()로 다시 읽을 수 있다.
	return _rename_file(tmp_path, _path) == OK


func _write_bytes(file: FileAccess, bytes: PackedByteArray) -> bool:
	return file.store_buffer(bytes)


func _rename_file(from: String, to: String) -> Error:
	return DirAccess.rename_absolute(
		ProjectSettings.globalize_path(from), ProjectSettings.globalize_path(to))


func _read_json(path: String) -> Dictionary:
	if not FileAccess.file_exists(path):
		return {}
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		return {}
	var raw := file.get_as_text()
	file.close()
	# JSON.parse_string 은 실패할 때 ERROR 를 찍는다. 세이브가 깨진 것은 .bak 으로
	# 되돌리면 되는 상황이라 콘솔에 남길 이유가 없고, CI 로그 게이트가 그 한 줄을
	# 빌드 실패로 읽는다. 에러를 값으로 받는 쪽을 쓴다.
	var json := JSON.new()
	if json.parse(raw) != OK:
		return {}
	return json.data if json.data is Dictionary else {}
