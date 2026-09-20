class_name MpAitShare
extends MpSharePort
## 기록 공유. 원본은 화면을 캡처해 보냈지만 여기서는 문구만 보낸다.
##
## 캡처 이미지는 웹뷰에서 만들어 넘기는 경로가 따로 필요하고, 공유되는 것은 결국
## 숫자 하나다. 문구만으로 충분하다.


func is_available() -> bool:
	var bridge := Platform.ait_bridge()
	if bridge == null:
		return false
	return bool(bridge.shareSupported())


func share_record(message: String) -> Result:
	var bridge := Platform.ait_bridge()
	if bridge == null:
		return Result.UNSUPPORTED
	var status := String(bridge.shareText(message))
	match status:
		"SUCCESS":
			return Result.SUCCESS
		"UNSUPPORTED":
			return Result.UNSUPPORTED
		_:
			return Result.ERROR
