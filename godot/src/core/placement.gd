class_name MpPlacement
extends RefCounted
## 카드 위 심볼 8개의 자리와 각도, 배율.
##
## 자리는 원본 `Assets/Prefabs/Card.prefab` 의 고정 앵커 8개를 그대로 쓴다. 격자가 아니라
## 손으로 흩뿌린 배치다. 매 라운드 각도와 배율만 다시 뽑아 같은 카드도 달라 보이게 한다.
## 원본에서 체감 난이도를 만들던 것이 사실상 이 흔들림 하나였다.

## 카드 중심을 원점으로 한 심볼 8개의 자리.
##
## 원본 Unity 값에서 y 부호를 뒤집었다. Unity RectTransform 은 위가 +y 이고
## Godot Control 은 아래가 +y 다. 배열 순서는 원본 자식 순서와 같게 둔다.
## 심볼이 겹쳤을 때 뒤에 그려진 쪽이 탭을 가져가는 동작까지 맞추기 위해서다.
const ANCHORS: Array[Vector2] = [
	Vector2(-169.0, 116.0),
	Vector2(-1.0, -26.0),
	Vector2(2.0, 224.0),
	Vector2(158.0, 93.0),
	Vector2(-95.0, -215.0),
	Vector2(-217.0, -58.0),
	Vector2(84.0, -220.0),
	Vector2(214.0, -70.0),
]

## 심볼 배율 범위. 원본 Random.Range(0.8f, 1.5f) 그대로다.
##
## 1.5배까지 커지면 이웃 심볼과 겹치고, 겹친 자리는 뒤에 그려진 쪽이 탭을 가져간다.
## 원본이 그랬으므로 그대로 두되, 실기기에서 오탭이 문제가 되면 여기 상한만 낮춘다.
const MIN_SYMBOL_SCALE := 0.8
const MAX_SYMBOL_SCALE := 1.5

## 심볼 회전 범위(도). 원본은 기존 각도에 이만큼을 누적으로 더했다.
const ROTATION_RANGE_DEGREES := 180.0


## 심볼 8개의 배치를 뽑는다.
##
## previous_rotations 를 주면 그 각도에 새 회전을 누적한다. 원본 Rotate 가 누적이었다.
static func build(rng: RandomNumberGenerator, previous_rotations: PackedFloat32Array = PackedFloat32Array()) -> Array[MpSymbolSpot]:
	var spots: Array[MpSymbolSpot] = []
	for i in ANCHORS.size():
		var base := 0.0
		if i < previous_rotations.size():
			base = previous_rotations[i]
		var rotation := base + rng.randf_range(-ROTATION_RANGE_DEGREES, ROTATION_RANGE_DEGREES)
		var scale := rng.randf_range(MIN_SYMBOL_SCALE, MAX_SYMBOL_SCALE)
		spots.append(MpSymbolSpot.new(ANCHORS[i], rotation, scale))
	return spots
