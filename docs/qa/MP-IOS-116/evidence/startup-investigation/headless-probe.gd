extends Node
func _ready() -> void:
 Save.use_storage(MpMemoryStorage.new())
 var window := Window.new()
 window.size = Vector2i.ZERO
 window.content_scale_size = Vector2i(648,1440)
 window.content_scale_mode = Window.CONTENT_SCALE_MODE_CANVAS_ITEMS
 window.content_scale_aspect = Window.CONTENT_SCALE_ASPECT_EXPAND
 add_child(window)
 print("[probe] initial rect=", window.get_visible_rect(), " size=", window.size)
 var main := load("res://scenes/main.tscn").instantiate() as Node
 window.add_child(main)
 var game := main.get("_game_screen") as MpGameScreen
 print("[probe] initial game=",game.size," stage=",game.stage_rect()," offsets=",game.offset_right,"/",game.offset_bottom)
 window.size = Vector2i(324,720)
 for i in 3:
  await get_tree().process_frame
 print("[probe] later rect=", window.get_visible_rect(), " size=", window.size, " game=",game.size," stage=",game.stage_rect()," offsets=",game.offset_right,"/",game.offset_bottom)
 window.queue_free()
 await get_tree().process_frame
 get_tree().quit()
