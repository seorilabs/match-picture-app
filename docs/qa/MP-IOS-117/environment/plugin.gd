@tool
extends EditorPlugin
var done := false
var frames := 0
func _enter_tree() -> void:
	set_process(true)
func _process(_delta: float) -> void:
	frames += 1
	if done or frames < 10 or EditorInterface.get_resource_filesystem().is_scanning():
		return
	done = true
	set_process(false)
	var paths := EditorInterface.get_editor_paths()
	var actual_user := ProjectSettings.globalize_path("user://")
	var settings := EditorInterface.get_editor_settings()
	print("[mp117-editor] self_contained=", paths.is_self_contained(), " config=", paths.get_config_dir(), " cache=", paths.get_cache_dir(), " user=", actual_user, " embed=", settings.get_setting("run/window_placement/game_embed_mode"))
	if not paths.is_self_contained() or not paths.get_config_dir().contains("MP-IOS-117/build/editor/editor_data") or not actual_user.contains("match-picture-MP-IOS-117-") or int(settings.get_setting("run/window_placement/game_embed_mode")) != -1:
		push_error("MP117 isolation guard rejected Editor Run")
		return
	print("[mp117-editor] actual EditorInterface.play_main_scene once")
	EditorInterface.play_main_scene()
	print("[mp117-editor] is_playing_scene=", EditorInterface.is_playing_scene())
