class_name MpSafeArea
extends RefCounted
## 화면에서 시스템이 가져가는 자리를 계산한다.
##
## 요즘 기기는 위에 카메라 구멍이나 노치가 있고 아래에 제스처 바가 있다. 이 게임은
## 상단에 HUD 가, 하단에 내 카드가 붙어 있어 양쪽 다 걸린다.
##
## `DisplayServer.get_display_safe_area()` 는 **픽셀** 단위다. 이 게임은 648 폭 기준으로
## 늘려 그리므로 뷰포트 단위로 환산해야 한다. 그 환산을 여기 한 곳에만 둔다.

## 데스크톱에서 눈으로 확인할 때 쓰는 강제 여백. `--safe-area=좌,상,우,하` 로 준다.
## 실기기 없이도 캡처 도구로 잘림을 볼 수 있어야 한다.
const OVERRIDE_PREFIX := "--safe-area="

## "강제 여백 없음". 실제 여백은 음수가 될 수 없다.
const NO_OVERRIDE := Vector4(-1.0, -1.0, -1.0, -1.0)


## 반환: Vector4(왼쪽, 위, 오른쪽, 아래) — 뷰포트 단위
static func insets(window: Window) -> Vector4:
	var forced := _override_insets()
	if forced != NO_OVERRIDE:
		return forced
	if Platform.is_ait():
		return _ait_insets(window)

	if window == null:
		return Vector4.ZERO

	# 데스크톱에서는 창이 화면보다 작을 수 있어 이 계산이 의미를 잃는다.
	# 안전 영역이 실제로 존재하는 플랫폼에서만 본다.
	if not Platform.is_mobile():
		return Vector4.ZERO

	var pixel_size := Vector2(DisplayServer.window_get_size())
	if pixel_size.x <= 0.0 or pixel_size.y <= 0.0:
		return Vector4.ZERO

	var safe := DisplayServer.get_display_safe_area()
	if safe.size.x <= 0 or safe.size.y <= 0:
		return Vector4.ZERO

	var view_size := window.get_visible_rect().size
	if view_size.x <= 0.0 or view_size.y <= 0.0:
		return Vector4.ZERO

	var scale_x := view_size.x / pixel_size.x
	var scale_y := view_size.y / pixel_size.y

	return Vector4(
		maxf(0.0, float(safe.position.x)) * scale_x,
		maxf(0.0, float(safe.position.y)) * scale_y,
		maxf(0.0, pixel_size.x - float(safe.position.x + safe.size.x)) * scale_x,
		maxf(0.0, pixel_size.y - float(safe.position.y + safe.size.y)) * scale_y
	)


## 앱인토스 SDK 는 CSS 뷰포트 픽셀로 여백을 준다. Godot 의 논리 뷰포트로 환산한다.
## 브리지가 없거나 값이 깨졌으면 0 으로 떨어져 일반 웹 미리보기가 가려지지 않는다.
static func _ait_insets(window: Window) -> Vector4:
	if window == null:
		return Vector4.ZERO
	return from_ait_payload(Platform.ait_safe_area_payload(), window.get_visible_rect().size)


## 브리지 payload 를 논리 뷰포트 단위로 바꾼다. WebView 없이도 검증할 수 있게 따로 뒀다.
static func from_ait_payload(payload: Dictionary, view_size: Vector2) -> Vector4:
	var source_width := maxf(float(payload.get("viewportWidth", 0.0)), 0.0)
	var source_height := maxf(float(payload.get("viewportHeight", 0.0)), 0.0)
	if source_width <= 0.0 or source_height <= 0.0 or view_size.x <= 0.0 or view_size.y <= 0.0:
		return Vector4.ZERO
	var scale_x := view_size.x / source_width
	var scale_y := view_size.y / source_height
	return Vector4(
		maxf(float(payload.get("left", 0.0)), 0.0) * scale_x,
		maxf(float(payload.get("top", 0.0)), 0.0) * scale_y,
		maxf(float(payload.get("right", 0.0)), 0.0) * scale_x,
		maxf(float(payload.get("bottom", 0.0)), 0.0) * scale_y
	)


static func _override_insets() -> Vector4:
	for argument in OS.get_cmdline_args() + OS.get_cmdline_user_args():
		if not argument.begins_with(OVERRIDE_PREFIX):
			continue
		var parts := argument.substr(OVERRIDE_PREFIX.length()).split(",")
		if parts.size() != 4:
			continue
		return Vector4(
			maxf(0.0, parts[0].to_float()),
			maxf(0.0, parts[1].to_float()),
			maxf(0.0, parts[2].to_float()),
			maxf(0.0, parts[3].to_float())
		)
	return NO_OVERRIDE


## 진단용 한 줄. 실기기에서 어떤 값이 나오는지 로그로 확인할 때 쓴다.
static func describe(window: Window) -> String:
	var value := insets(window)
	return (
		"safe area 여백(뷰포트 단위) 좌 %.0f 상 %.0f 우 %.0f 하 %.0f / 창 %s / 안전영역 %s"
		% [
			value.x, value.y, value.z, value.w,
			str(DisplayServer.window_get_size()),
			str(DisplayServer.get_display_safe_area()),
		]
	)
