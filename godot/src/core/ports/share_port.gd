class_name MpSharePort
extends RefCounted
## 기록 공유 추상.

enum Result {
	SUCCESS,
	UNSUPPORTED,
	ERROR,
}


func is_available() -> bool:
	return false


func share_record(_message: String) -> Result:
	return Result.UNSUPPORTED
