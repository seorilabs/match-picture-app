extends Node
## 조립된 화면으로 한 판을 끝까지 눌러 보는 통합 스모크.
##
## 코어 테스트는 규칙이 맞는지만 본다. 버튼이 실제로 눌리는 상태인지, 판정 중에 입력이
## 잠기는지, 끝나면 결과 화면이 뜨는지는 조립된 뒤에야 확인할 수 있다.
##
##   godot --path godot res://tests/play_through.tscn

var _failures: Array[String] = []
var _checks := 0
var _main: Node


func _ready() -> void:
	print("[play] 시작")
	# 실제 user:// 기록을 덮어쓰지 않게 저장소를 갈아끼운다.
	Save.use_storage(MpMemoryStorage.new())
	await _play_one_game()
	# 심볼 텍스처를 들고 있는 화면을 먼저 정리한다. 남겨 두면 종료 시
	# "resources still in use at exit" 가 찍히고 CI 로그 게이트가 실패로 처리한다.
	if _main != null:
		_main.queue_free()
		_main = null
		await get_tree().process_frame

	print("[play] 검사 %d건, 실패 %d건" % [_checks, _failures.size()])
	for failure in _failures:
		printerr("[play] 실패: %s" % failure)
	get_tree().quit(1 if not _failures.is_empty() else 0)


func _play_one_game() -> void:
	var main: Node = load("res://scenes/main.tscn").instantiate()
	_main = main
	add_child(main)
	for i in 6:
		await get_tree().process_frame

	var screen: MpGameScreen = main.get("_game_screen")
	var popup: MpResultPopup = main.get("_result_popup")
	var tutorial: MpTutorialOverlay = main.get("_tutorial")
	_check(screen != null, "게임 화면이 조립됐다")
	_check(popup != null and not popup.visible, "시작 시 결과 화면은 숨어 있다")
	if screen == null or tutorial == null:
		return

	# 앱을 켜면 타이틀이 먼저다. 시작을 눌러야 그 다음이 진행된다.
	var title: MpTitleScreen = main.get("_title")
	_check(title != null and title.visible, "앱을 켜면 타이틀이 먼저 뜬다")
	_check(not tutorial.visible, "타이틀에서는 설명이 아직 뜨지 않는다")
	if title == null:
		return
	title.start_pressed.emit()
	await get_tree().process_frame
	_check(not title.visible, "시작을 누르면 타이틀이 닫힌다")

	# 처음 켠 사람에게는 설명이 먼저 뜬다. 닫아야 판이 시작된다.
	_check(tutorial.visible, "최초 실행에는 설명이 뜬다")
	_check(not bool(Save.get_value("has_played", false)), "아직 플레이 기록이 없다")
	tutorial._on_close()
	await get_tree().process_frame
	_check(not tutorial.visible, "설명을 닫으면 사라진다")
	_check(bool(Save.get_value("has_played", false)), "설명을 닫으면 플레이 기록이 남는다")

	var game: MpGameState = screen.get("_game")
	var mine: MpCardView = screen.get("_mine_card")
	var opponent: MpCardView = screen.get("_opponent_card")
	_check(game != null, "게임 상태가 있다")
	_check(mine != null and opponent != null, "카드 두 장이 있다")
	if game == null or mine == null or opponent == null:
		return

	_check(opponent.find_symbol(game.current_round().hint) != null, "상대 카드에도 정답 심볼이 있다")
	var opponent_button := opponent.find_symbol(game.current_round().hint)
	_check(opponent_button != null and opponent_button.disabled, "상대 카드는 눌리지 않는다")

	# 오답을 한 번 넣어 입력이 잠기는지 본다.
	var first_round := game.current_round()
	var wrong := ""
	for symbol in first_round.mine:
		if symbol != first_round.hint:
			wrong = symbol
			break
	_press(mine, wrong)
	await get_tree().process_frame
	_check(game.state() == MpGameState.State.PENALTY, "오답이면 잠금 상태로 간다")
	var locked := mine.find_symbol(first_round.hint)
	_check(locked != null and locked.disabled, "잠금 중에는 정답 버튼도 눌리지 않는다")

	# 잠금이 풀릴 때까지 기다린다.
	var waited := 0.0
	while game.state() == MpGameState.State.PENALTY and waited < 5.0:
		waited += get_process_delta_time()
		await get_tree().process_frame
	_check(game.state() == MpGameState.State.PLAYING, "잠금이 풀리고 같은 문제로 돌아온다")
	_check(game.current_round() == first_round, "오답 뒤에도 같은 문제다")

	# 뒤로가기 우선순위. 원본 Update() 의 순서를 그대로 지키는지 본다.
	var quit_confirm: MpQuitConfirm = main.get("_quit_confirm")
	var settings: MpSettingsPopup = main.get("_settings")
	main.call("go_back")
	await get_tree().process_frame
	_check(quit_confirm.visible, "게임 중 뒤로가기는 종료 확인을 띄운다")
	settings.show_settings()
	await get_tree().process_frame
	main.call("go_back")
	await get_tree().process_frame
	_check(not settings.visible, "설정이 열려 있으면 그것부터 닫는다")
	_check(quit_confirm.visible, "설정을 닫아도 종료 확인은 남는다")
	main.call("go_back")
	await get_tree().process_frame
	_check(not quit_confirm.visible, "다시 누르면 종료 확인이 닫힌다")

	# 정답만 눌러 끝까지 간다.
	var guard := 0
	while game.state() != MpGameState.State.FINISHED and guard < 3000:
		guard += 1
		if game.accepts_input():
			var button := mine.find_symbol(game.current_round().hint)
			if button == null:
				_failures.append("정답 심볼 버튼을 내 카드에서 찾지 못했다")
				break
			if button.disabled:
				_failures.append("입력을 받아야 하는데 정답 버튼이 잠겨 있다")
				break
			button.pressed.emit()
		await get_tree().process_frame

	_checks += 1
	if game.state() != MpGameState.State.FINISHED:
		_failures.append("한 판을 끝내지 못했다")
		return

	_check(game.correct_count() == MpRules.TOTAL_CARDS, "정답 10회로 끝난다")
	_check(game.wrong_count() == 1, "넣어 둔 오답 1회가 기록된다")
	_check(game.elapsed_seconds() > 0.0, "기록이 0보다 크다")

	await get_tree().process_frame
	_check(popup.visible, "끝나면 결과 화면이 뜬다")
	var leaderboard_button := popup.get("_leaderboard_button") as Button
	_check(leaderboard_button != null and not leaderboard_button.visible,
		"순위표 ID 가 비어 있으면 결과 화면에 순위표 버튼이 없다")

	# 기록이 저장됐는지. 원본에는 없던 기능이라 여기서 확인해 둔다.
	var saved := float(Save.get_value(MpBestRecord.BEST_KEY, MpBestRecord.NO_RECORD))
	_check(MpBestRecord.has_record(saved), "베스트 기록이 저장된다")


func _press(card: MpCardView, symbol: String) -> void:
	var button := card.find_symbol(symbol)
	if button == null:
		_failures.append("심볼 버튼을 찾지 못했다: %s" % symbol)
		return
	if button.disabled:
		_failures.append("눌러야 하는데 버튼이 잠겨 있다: %s" % symbol)
		return
	button.pressed.emit()


func _check(condition: bool, label: String) -> void:
	_checks += 1
	if not condition:
		_failures.append(label)
