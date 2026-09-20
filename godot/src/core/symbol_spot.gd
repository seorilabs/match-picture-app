class_name MpSymbolSpot
extends RefCounted
## 카드 위 심볼 하나의 자리와 각도, 배율. 좌표는 카드 중심 기준이다.

var offset: Vector2
var rotation_degrees: float
var scale: float


func _init(p_offset: Vector2, p_rotation_degrees: float, p_scale: float) -> void:
	offset = p_offset
	rotation_degrees = p_rotation_degrees
	scale = p_scale
