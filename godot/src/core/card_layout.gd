class_name MpCardLayout
extends RefCounted
## 카드 두 장을 무대에 놓는 자리.
##
## 게임 화면과 최초 실행 안내가 카드를 같은 자리에 그려야 해서 계산만 떼어 놨다.
## 원본도 안내 패널이 실제 게임 패널과 같은 rect 를 쓰는 사본이었다
## (GameScene.unity: "PanelGame - Tutorial" 이 PanelGame 과 같은 앵커·크기).
## 노드도 화면도 모르는 순수 계산이라 코어에 둔다.

## 카드에 곱할 배율.
var factor: float

## 무대 좌상단 기준 상대 카드 위치.
var opponent_position: Vector2

## 무대 좌상단 기준 내 카드 위치.
var mine_position: Vector2


func _init(p_factor: float, p_opponent_position: Vector2, p_mine_position: Vector2) -> void:
	factor = p_factor
	opponent_position = p_opponent_position
	mine_position = p_mine_position


## 무대 크기에서 카드 두 장의 배율과 자리를 뽑는다.
##
## 원본 CanvasScaler 를 재현한 뷰포트에서는 평소 CARD_RENDER_SCALE 이 그대로 나오고,
## 화면이 유난히 좁거나 낮을 때만 더 줄어든다.
static func compute(stage: Vector2) -> MpCardLayout:
	var by_width := (stage.x - MpRules.CARD_SIDE_MARGIN * 2.0) / MpRules.CARD_SIZE
	var by_height := (stage.y - MpRules.CARD_GAP) / (MpRules.CARD_SIZE * 2.0)
	var factor := minf(MpRules.CARD_RENDER_SCALE, minf(by_width, by_height))
	factor = maxf(factor, 0.1)

	var drawn := MpRules.CARD_SIZE * factor
	var left := (stage.x - drawn) / 2.0
	var gap := clampf(stage.y - drawn * 2.0, 0.0, MpRules.CARD_GAP)
	var top := (stage.y - drawn * 2.0 - gap) / 2.0
	return MpCardLayout.new(factor, Vector2(left, top), Vector2(left, top + drawn + gap))
