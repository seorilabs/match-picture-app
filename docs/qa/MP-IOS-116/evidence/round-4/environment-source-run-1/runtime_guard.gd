extends Node
var _capture_index := 0
func _enter_tree() -> void:
	var actual_user := ProjectSettings.globalize_path("user://")
	var isolated := actual_user.contains("match-picture-MP-IOS-116-round-4-385fa2e")
	print("[review-runtime] user://=", actual_user, " isolated=", isolated, " before Save")
	assert(isolated, "QA storage isolation failed")
func _input(event: InputEvent) -> void:
	if not event is InputEventKey or not event.pressed or event.echo:
		return
	if event.keycode == KEY_F6:
		print("[review-runtime] CUA F6 -> product Back notification proxy; no OS hardware proof")
		get_tree().current_scene.notification(NOTIFICATION_WM_GO_BACK_REQUEST)
	if event.keycode == KEY_F7:
		_capture_index += 1
		var frame := get_viewport().get_texture().get_image()
		DirAccess.make_dir_recursive_absolute("res://build/review/run-1")
		var path := "res://build/review/run-1/capture-%d-%d.png" % [Time.get_ticks_msec(), _capture_index]
		print("[review-runtime] capture=", path, " pixels=", frame.get_size(), " window=", get_window().size, " visible_rect=", get_viewport().get_visible_rect(), " result=", frame.save_png(path))

func _ready() -> void:
	call_deferred("_read_layout_evidence")
func _read_layout_evidence() -> void:
	print("[review-layout] window=", get_window().size, " visible_rect=", get_viewport().get_visible_rect())
	var main := get_tree().current_scene
	if main == null:
		return
	for field in ["_safe_area_root", "_game_screen", "_tutorial"]:
		var control = main.get(field)
		if control is Control:
			_read_control(field, control)
	var game = main.get("_game_screen")
	if game != null:
		for field in ["_stage", "_opponent_card", "_mine_card", "_hud"]:
			var control = game.get(field)
			if control is Control:
				_read_control(field, control)
func _read_control(label: String, control: Control) -> void:
	print("[review-layout] ", label, " size=", control.size, " rect=", control.get_global_rect(), " transform=", control.get_global_transform())
