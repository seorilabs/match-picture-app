@tool
extends EditorPlugin
var _frames := 0
var _configured := false
func _enter_tree() -> void:
	print("[review-editor] host display=", DisplayServer.get_name(), " actual GUI child required")
	set_process(true)
func _process(_delta: float) -> void:
	_frames += 1
	if _frames < 10 or EditorInterface.get_resource_filesystem().is_scanning():
		return
	if not _configured:
		_configured = true
		var paths := EditorInterface.get_editor_paths()
		var config := paths.get_config_dir()
		var cache := paths.get_cache_dir()
		var isolated := paths.is_self_contained() and config.contains("mp116-godot-ui-_zc8d_lb") and cache.contains("mp116-godot-ui-_zc8d_lb") and config.contains("editor_data") and cache.contains("editor_data")
		print("[review-editor] self_contained=", paths.is_self_contained(), " config=", config, " cache=", cache, " isolated=", isolated)
		var actual_user := ProjectSettings.globalize_path("user://")
		print("[review-editor] user://=", actual_user)
		if not isolated or not actual_user.contains("match-picture-MP-IOS-116-round-3-run3-02e63ae"):
			set_process(false)
			push_error("QA isolation guard rejected Editor Run")
			return
		var settings := EditorInterface.get_editor_settings()
		print("[review-editor] game_embed_mode at initial load=", settings.get_setting("run/window_placement/game_embed_mode"))
		if int(settings.get_setting("run/window_placement/game_embed_mode")) != -1:
			set_process(false)
			push_error("QA independent window setting was not loaded")
			return
		settings.set_setting("run/window_placement/rect", 0)
		settings.set_setting("network/debug/remote_port", 31663)
		settings.set_setting("network/language_server/remote_port", 31665)
		print("[review-editor] game_embed_mode=", settings.get_setting("run/window_placement/game_embed_mode"), " remote_port=", settings.get_setting("network/debug/remote_port"))
		return
	set_process(false)
	if EditorInterface.is_playing_scene():
		return
	print("[review-editor] starting actual normal main Editor Run once")
	EditorInterface.play_main_scene()
	print("[review-editor] is_playing_scene=", EditorInterface.is_playing_scene())
