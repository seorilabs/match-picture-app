extends Node
func _enter_tree() -> void:
	var actual := ProjectSettings.globalize_path("user://")
	print("[mp117-runtime] user=", actual, " before Save; isolated=", actual.contains("match-picture-MP-IOS-117-"))
	assert(actual.contains("match-picture-MP-IOS-117-"))
func _input(event: InputEvent) -> void:
	if not event is InputEventKey or not event.pressed or event.echo:
		return
	if event.keycode == KEY_B and event.ctrl_pressed:
		var main := _main()
		print("[mp117-runtime] Ctrl+B -> product Back notification proxy")
		main.notification(NOTIFICATION_WM_GO_BACK_REQUEST)
	if event.keycode == KEY_F7 and get_tree().current_scene.get("_main") == null:
		_capture.call_deferred()
	if event.keycode == KEY_F11:
		_observe.call_deferred()
func _ready() -> void:
	_observe.call_deferred()
func _main() -> Node:
	var scene := get_tree().current_scene
	return scene.get("_main") if scene != null and scene.get("_main") != null else scene
func _observe() -> void:
	print("[mp117-observe] window=", get_window().size, " visible_rect=", get_viewport().get_visible_rect(), " display=", DisplayServer.get_name(), " save=", Save.snapshot())
	var main := _main()
	if main == null:
		return
	var ads = main.get("_ads")
	if ads != null and ads.get("privacy") != null:
		print("[mp117-observe] ATT=", ads.privacy.status, " UMP=", ads.privacy.allows_ads, " ATTrequests=", ads.privacy.requests, " SDKinits=", ads.initializations, " loads=", ads._loader.calls, " showing=", ads._showing, " loading=", ads._loading, " generation=", ads._generation, " consent_busy=", ads._consent_busy)
		for request in ads._loader.requests:
			print("[mp117-observe] request_extras=", request.extras)

func _capture() -> void:
	await RenderingServer.frame_post_draw
	DirAccess.make_dir_recursive_absolute("res://build/review")
	var path := "res://build/review/capture-%d.png" % Time.get_ticks_msec()
	var frame := get_viewport().get_texture().get_image()
	print("[mp117-capture] path=", path, " pixels=", frame.get_size(), " result=", frame.save_png(path))
