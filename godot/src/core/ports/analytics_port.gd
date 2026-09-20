class_name MpAnalyticsPort
extends RefCounted
## 계측 전송 추상. 코어는 어느 표면으로 나가는지 모른다.
##
## 이벤트 이름과 허용 파라미터는 MpAnalyticsEvents 가 계약으로 가진다. 여기서는
## 계약을 통과한 것만 받아 내보낸다.


func log_event(name: String, params: Dictionary) -> void:
	pass


## 런타임 오류 보고. 지표와 같은 경로로 나가되 이름을 따로 둔다.
func record_error(message: String, context: Dictionary) -> void:
	pass
