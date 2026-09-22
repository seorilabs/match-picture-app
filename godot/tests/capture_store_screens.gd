extends Node
## App Store 제출용 스크린샷을 만든다.
##
##   godot --path godot res://tests/capture_store_screens.tscn
##
## 결과는 build/store/<로케일>/ 에 떨어진다. build/ 는 커밋하지 않는다.
##
## `capture_screens.gd` 와 목적이 다르다. 그쪽은 화면비별로 잘림을 눈으로 보려는
## QA 용이고, 여기는 App Store Connect 가 받는 정확한 픽셀 크기로 홍보용 몇 장만
## 만든다. 둘을 합치면 QA 캡처가 필요 없이 무거워진다.
##
## 크기는 App Store Connect 의 displayType 이 요구하는 값 그대로다. 게임이 원본
## CanvasScaler 를 재현해 어떤 비율에서도 그대로 그려지므로 늘리거나 잘라 붙이지
## 않는다.

const OUT_DIR := "res://build/store"

## displayType 과 픽셀 크기. iPad 두 종류는 같은 크기를 쓰지만 App Store Connect 가
## 별도 set 으로 요구해서 둘 다 만든다.
const DISPLAY_TYPES: Array[Dictionary] = [
	{"type": "APP_IPHONE_65", "size": Vector2i(1242, 2688)},
	{"type": "APP_IPHONE_55", "size": Vector2i(1242, 2208)},
	{"type": "APP_IPAD_PRO_129", "size": Vector2i(2048, 2732)},
	{"type": "APP_IPAD_PRO_3GEN_129", "size": Vector2i(2048, 2732)},
]

## 스토어에 올리는 순서. 첫 장이 목록에 뜨므로 게임 화면을 앞에 둔다.
const SHOTS := ["game", "tutorial", "result"]

const LOCALES := ["ko", "en"]

## 결과 화면에 보여 줄 값. 실제 판을 끝내는 대신 팝업만 띄운다.
const RESULT_SECONDS := 19.2
const RESULT_BEST := 23.4

var _failed := false


func _ready() -> void:
	for locale in LOCALES:
		DirAccess.make_dir_recursive_absolute(
			ProjectSettings.globalize_path("%s/%s" % [OUT_DIR, locale]))
		# 저장하지 않는다. 캡처 때문에 개발 기기의 언어 설정이 바뀌면 안 된다.
		Locale.set_language(locale, false)
		for entry in DISPLAY_TYPES:
			await _capture(locale, String(entry["type"]), entry["size"] as Vector2i)
	Locale.set_language("auto", false)
	print("[store] 끝. 결과: %s" % OUT_DIR)
	get_tree().quit(1 if _failed else 0)


## 엔진의 `canvas_items` + `expand` 스트레치를 SubViewport 에서 재현한다.
##
## 이 설정은 루트 Window 에만 걸린다. 직접 만든 SubViewport 는 그냥 큰 캔버스가 되어
## 648x1440 기준 레이아웃이 화면 한가운데 원본 크기로 박힌다. `size_2d_override` 로
## 2D 좌표계를 설계 크기에 맞추고 렌더 타깃만 실제 픽셀로 둔다.
##
## 배율은 엔진과 같은 식이다. 짧은 쪽에 맞추고 남는 쪽은 캔버스가 넓어진다.
static func canvas_size_for(pixels: Vector2i) -> Vector2i:
	var base := Vector2(
		float(ProjectSettings.get_setting_with_override("display/window/size/viewport_width")),
		float(ProjectSettings.get_setting_with_override("display/window/size/viewport_height")))
	if base.x <= 0.0 or base.y <= 0.0:
		return pixels
	var factor := minf(float(pixels.x) / base.x, float(pixels.y) / base.y)
	if factor <= 0.0:
		return pixels
	return Vector2i(roundi(float(pixels.x) / factor), roundi(float(pixels.y) / factor))


func _capture(locale: String, display_type: String, size: Vector2i) -> void:
	var viewport := SubViewport.new()
	viewport.size = size
	viewport.size_2d_override = canvas_size_for(size)
	viewport.size_2d_override_stretch = true
	viewport.disable_3d = true
	viewport.render_target_update_mode = SubViewport.UPDATE_ALWAYS
	viewport.render_target_clear_mode = SubViewport.CLEAR_MODE_ALWAYS
	add_child(viewport)

	var scene: Node = load("res://scenes/main.tscn").instantiate()
	viewport.add_child(scene)
	for i in 8:
		await get_tree().process_frame

	# 타이틀에서 바로 판으로 넘어간다. 스토어에서는 무엇을 하는 게임인지가 먼저다.
	if scene.has_method("start_game_for_capture"):
		scene.call("start_game_for_capture")
	for i in 12:
		await get_tree().process_frame
	await RenderingServer.frame_post_draw
	_save(viewport, locale, display_type, 0, "game")

	if scene.has_method("show_overlay_for_capture"):
		scene.call("show_overlay_for_capture", "tutorial")
		for i in 6:
			await get_tree().process_frame
		await RenderingServer.frame_post_draw
		_save(viewport, locale, display_type, 1, "tutorial")
		scene.call("go_back")
		await get_tree().process_frame

	if scene.has_method("show_result_for_capture"):
		scene.call("show_result_for_capture", RESULT_SECONDS, RESULT_BEST, true)
		for i in 6:
			await get_tree().process_frame
		await RenderingServer.frame_post_draw
		_save(viewport, locale, display_type, 2, "result")

	viewport.queue_free()


func _save(
	viewport: SubViewport, locale: String, display_type: String, index: int, label: String
) -> void:
	var texture := viewport.get_texture()
	if texture == null:
		printerr("[store] 뷰포트 텍스처가 없다: %s %s" % [display_type, label])
		_failed = true
		return
	var image := texture.get_image()
	if image == null or image.is_empty():
		printerr("[store] 빈 이미지다: %s %s" % [display_type, label])
		_failed = true
		return
	# 파일 이름에 순서를 넣어 업로드 쪽이 정렬만으로 순서를 맞출 수 있게 한다.
	var path := "%s/%s/%s-%d-%s.png" % [OUT_DIR, locale, display_type, index, label]
	var error := image.save_png(path)
	if error != OK:
		printerr("[store] 저장 실패 %s: %s" % [path, error_string(error)])
		_failed = true
		return
	print("[store] %s (%dx%d)" % [path, image.get_width(), image.get_height()])
