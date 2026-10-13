extends "res://tests/review_sandbox.gd"
func _ready() -> void:
	_ads.privacy.request_accepted = false
	super._ready()
	print("[mp117-case] native request rejected initially; status remains0")
func _input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo and event.ctrl_pressed:
		if event.keycode == KEY_R:
			_ads.privacy.request_accepted = true
			_ads.prepare()
			print("[mp117-case] next explicit prepare after rejected request")
		if event.keycode == KEY_T:
			_ads.privacy.authorization_finished.emit(-1)
			print("[mp117-case] timeout callback -1; OS status unchanged0; no immediate retry")
		if event.keycode == KEY_U:
			_ads.privacy.authorization_finished.emit(0)
			print("[mp117-case] completed callback0; OS status unchanged0; no immediate retry")
		if event.keycode == KEY_P:
			_ads.prepare()
			print("[mp117-case] explicit prepare")
		if event.keycode == KEY_W:
			_ads.privacy.status = 2
			_ads._on_application_resumed()
			print("[mp117-case] OS permission withdrawn without authorization callback")
		if event.keycode == KEY_L:
			var late := Cases.FakeAd.new()
			_ads._loader.callbacks[0].on_ad_loaded.call(late)
			print("[mp117-case] first generation late ad destroyed=", late.destroyed, " shows=", late.shows)
		_print_privacy_state()
	super._input(event)
