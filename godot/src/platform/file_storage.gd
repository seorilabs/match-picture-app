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
	tmp.store_string(JSON.stringify(data))
	tmp.close()

	var dir := DirAccess.open(_path.get_base_dir())
	if dir == null:
		return false
	if dir.file_exists(_path):
		dir.rename(_path, _path + BAK_SUFFIX)
	return dir.rename(tmp_path, _path) == OK


func _read_json(path: String) -> Dictionary:
	if not FileAccess.file_exists(path):
		return {}
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		return {}
	var raw := file.get_as_text()
	file.close()
	var parsed: Variant = JSON.parse_string(raw)
	return parsed if parsed is Dictionary else {}
