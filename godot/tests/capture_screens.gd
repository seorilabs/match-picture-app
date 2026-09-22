extends Node
## 화면이 실제로 그려지는지 눈으로 확인하기 위한 캡처 도구.
##
## 헤드리스 스모크는 컨트롤 트리가 서는지까지만 본다. 카드가 잘리거나 심볼이 겹치는
## 것은 그려 봐야 안다. 이 씬은 여러 화면비로 실제 렌더링해 PNG 로 남긴다.
##
##   godot --path godot res://tests/capture_screens.tscn
##
## 결과는 build/qa/ 에 떨어진다. build/ 는 커밋하지 않는다.

const OUT_DIR := "res://build/qa"

## 원본 Unity CanvasScaler 를 재현한 뷰포트에서 실제로 나오는 크기들이다.
## 648x1440 은 20:9 이상, 810x1440 은 16:9, 1080x1440 은 4:3 태블릿에 해당한다.
const SIZES: Array[Vector2i] = [
	Vector2i(648, 1440),
	Vector2i(810, 1440),
	Vector2i(1080, 1440),
]

## 실제 창은 macOS 작업 영역보다 커질 수 없다. 고정 크기 SubViewport 에서 그린다.
var _failed := false


func _ready() -> void:
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(OUT_DIR))
	for size in SIZES:
		await _capture(size)
	print("[capture] 끝. 결과: %s" % OUT_DIR)
	get_tree().quit(1 if _failed else 0)


func _capture(size: Vector2i) -> void:
	var viewport := SubViewport.new()
	viewport.size = size
	viewport.disable_3d = true
	viewport.render_target_update_mode = SubViewport.UPDATE_ALWAYS
	viewport.render_target_clear_mode = SubViewport.CLEAR_MODE_ALWAYS
	add_child(viewport)

	var scene: Node = load("res://scenes/main.tscn").instantiate()
	viewport.add_child(scene)

	# 앱을 켜면 타이틀이 먼저다. 찍고 나서 시작을 눌러 게임 화면으로 넘어간다.
	for i in 8:
		await get_tree().process_frame
	await RenderingServer.frame_post_draw
	_save(viewport, "title-%dx%d.png" % [size.x, size.y])
	if scene.has_method("start_game_for_capture"):
		scene.call("start_game_for_capture")

	# 레이아웃이 자리를 잡고 첫 라운드가 그려질 때까지 몇 프레임 흘린다.
	for i in 12:
		await get_tree().process_frame
	await RenderingServer.frame_post_draw
	_save(viewport, "game-%dx%d.png" % [size.x, size.y])

	# 나머지 화면도 같은 비율에서 확인한다. 실제 판을 끝내는 대신 팝업만 띄운다.
	if scene.has_method("show_result_for_capture"):
		scene.call("show_result_for_capture", 23.4, 30.0, false)
		for i in 6:
			await get_tree().process_frame
		await RenderingServer.frame_post_draw
		_save(viewport, "result-%dx%d.png" % [size.x, size.y])
		scene.call("show_result_for_capture", 19.2, 30.0, true)
		for i in 4:
			await get_tree().process_frame
		await RenderingServer.frame_post_draw
		_save(viewport, "result-best-%dx%d.png" % [size.x, size.y])

	if scene.has_method("show_overlay_for_capture"):
		for overlay in ["tutorial", "settings", "quit"]:
			scene.call("show_overlay_for_capture", overlay)
			for i in 4:
				await get_tree().process_frame
			await RenderingServer.frame_post_draw
			_save(viewport, "%s-%dx%d.png" % [overlay, size.x, size.y])
			scene.call("go_back")
			await get_tree().process_frame

	viewport.queue_free()


func _save(viewport: SubViewport, file_name: String) -> void:
	var texture := viewport.get_texture()
	if texture == null:
		printerr("[capture] 뷰포트 텍스처가 없다: %s" % file_name)
		_failed = true
		return
	var image := texture.get_image()
	if image == null or image.is_empty():
		printerr("[capture] 빈 이미지다: %s" % file_name)
		_failed = true
		return
	var path := "%s/%s" % [OUT_DIR, file_name]
	var error := image.save_png(path)
	if error != OK:
		printerr("[capture] 저장 실패 %s: %s" % [path, error_string(error)])
		_failed = true
		return
	print("[capture] %s (%dx%d)" % [path, image.get_width(), image.get_height()])
