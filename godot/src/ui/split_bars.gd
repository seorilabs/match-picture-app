class_name MpSplitBars
extends Control
## 라운드별 소요 시간 막대.
##
## 판이 끝나고 "어디서 막혔나"를 한눈에 보여 준다. 숫자를 아홉 줄 늘어놓으면 결과
## 팝업이 화면을 넘기므로 막대 아홉 개로 줄였다. 가장 빠른 구간과 가장 느린 구간만
## 색으로 짚고 나머지는 같은 색으로 둔다. 새 지표가 아니라 이미 잰 시간을 쪼개 보인
## 것뿐이다.

const HEIGHT := 84.0
const BAR_GAP := 6.0

## 0 에 가까운 구간도 막대가 보이게 남기는 최소 높이.
const MIN_BAR_HEIGHT := 3.0

var _splits: Array[float] = []


func _init() -> void:
	custom_minimum_size = Vector2(0.0, HEIGHT)
	size_flags_horizontal = Control.SIZE_EXPAND_FILL
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	resized.connect(queue_redraw)


## 구간이 없으면(첫 판이 아직 안 끝났거나 기록이 없으면) 줄째로 숨는다.
func set_splits(splits: Array[float]) -> void:
	_splits = splits.duplicate()
	visible = not _splits.is_empty()
	queue_redraw()


func _draw() -> void:
	if _splits.is_empty() or size.x <= 0.0:
		return
	var slowest := float(_splits.max())
	var fastest := float(_splits.min())
	if slowest <= 0.0:
		return

	var slot := size.x / float(_splits.size())
	var width := maxf(slot - BAR_GAP, 1.0)
	for i in _splits.size():
		var height := maxf(size.y * (_splits[i] / slowest), MIN_BAR_HEIGHT)
		var color := MpUiKit.PANEL_BORDER
		# 같은 값이 여럿이면 둘 다 칠해진다. 가장 빠른 쪽이 이긴다.
		if is_equal_approx(_splits[i], slowest):
			color = MpUiKit.WRONG
		if is_equal_approx(_splits[i], fastest):
			color = MpUiKit.CORRECT
		draw_rect(Rect2(i * slot + BAR_GAP / 2.0, size.y - height, width, height), color)
