extends Node
## 엔진 스모크. autoload 가 서고 폰트와 효과음이 실제로 붙었는지 확인한다.
##
## 실행: godot --headless --path godot tests/test_runner.tscn

var _failures: Array[String] = []
var _checks := 0


class FakeGameCenter:
	extends RefCounted

	signal authenticated(ok: bool, error: String)

	var authenticate_calls := 0
	var currently_authenticated := false

	func is_authenticated() -> bool:
		return currently_authenticated

	func authenticate() -> void:
		authenticate_calls += 1


class FakePlayGames:
	extends RefCounted

	signal userAuthenticated(authenticated: bool)

	var authentication_checks := 0

	func isAuthenticated() -> void:
		authentication_checks += 1


func _ready() -> void:
	print("[smoke] 시작")

	_check_autoloads()
	_check_surface()
	_check_fonts()
	_check_audio()
	_check_translations()
	_check_storage()
	_check_native_leaderboard_configuration()
	_check_native_leaderboard_authentication()
	_check_adapter_wiring()

	print("[smoke] 검사 %d건, 실패 %d건" % [_checks, _failures.size()])
	for failure in _failures:
		printerr("[smoke] 실패: %s" % failure)
	get_tree().quit(1 if not _failures.is_empty() else 0)


func _check_autoloads() -> void:
	_check(Platform != null, "Platform autoload 가 있다")
	_check(Save != null, "Save autoload 가 있다")
	_check(Locale != null, "Locale autoload 가 있다")
	_check(Ui != null, "Ui autoload 가 있다")
	_check(Audio != null, "Audio autoload 가 있다")
	_check(Locale.SUPPORTED.has(Locale.current_locale()), "로케일이 지원 목록 안에 있다")


## CI 와 로컬 테스트는 에디터 바이너리를 --headless 로 돌린다. Platform 이 이것을
## EDITOR 로 잡으면 어댑터가 no-op 으로 빠지지 않아, 헤드리스에서 효과음이 재생된 채
## 종료되고 "resources still in use at exit" 가 찍힌다. 실제로 그렇게 깨진 적이 있다.
func _check_surface() -> void:
	_check(Platform.surface() == Platform.Surface.HEADLESS, "헤드리스를 HEADLESS 로 판정한다")
	_check(not Platform.is_web(), "헤드리스는 웹이 아니다")
	_check(not Platform.is_ait(), "헤드리스는 앱인토스가 아니다")


## 한글 폰트가 붙지 않으면 앱인토스에서 라벨이 통째로 두부(□)가 된다.
## 눈으로 보기 전에 여기서 잡는다.
func _check_fonts() -> void:
	_check(Ui.word_font != null, "단어용 한글 폰트가 로드됐다")
	_check(Ui.pixel_font != null, "숫자용 픽셀 폰트가 로드됐다")
	_check(ThemeDB.fallback_font == Ui.word_font, "ThemeDB.fallback_font 가 한글 폰트다")
	var root := get_tree().root
	_check(root.theme != null and root.theme.default_font != null, "창 테마에 기본 폰트가 붙었다")


func _check_audio() -> void:
	_check(ResourceLoader.exists(Audio.CORRECT_PATH), "정답 효과음 파일이 있다")
	_check(ResourceLoader.exists(Audio.WRONG_PATH), "오답 효과음 파일이 있다")


## 어댑터 주입이 화면 조립보다 앞에 있어야 한다.
##
## 순서가 뒤집히면 세이브를 읽거나 화면을 만들면서 나가는 이벤트가 보낼 곳이 없어
## 조용히 사라진다. 조직 내 다른 게임에서 이벤트가 28일간 0건이던 원인이 이것이었다.
## 실행해서는 잡기 어려운 종류라 소스를 그대로 읽어 확인한다.
func _check_adapter_wiring() -> void:
	var source := FileAccess.get_file_as_string("res://src/ui/main.gd")
	_check(not source.is_empty(), "main.gd 를 읽을 수 있다")
	if source.is_empty():
		return

	var ready_at := source.find("func _ready() -> void:")
	var install_at := source.find("_install_adapters()", ready_at)
	var build_at := source.find("_build_game_layer()", ready_at)
	var open_event_at := source.find("MpAnalyticsEvents.GAME_OPEN", ready_at)

	_check(ready_at >= 0, "main.gd 에 _ready 가 있다")
	_check(install_at > ready_at, "_ready 가 어댑터를 주입한다")
	_check(build_at > install_at, "어댑터 주입이 화면 조립보다 앞에 있다")
	_check(open_event_at > install_at, "game_open 이 어댑터 주입 뒤에 나간다")


## 세이브는 tmp 에 전부 쓴 뒤 rename 하고 직전 내용을 .bak 한 세대만 남긴다.
## 게임 도중 앱이 죽어도 반쯤 쓰인 파일이 정본 자리에 남지 않아야 한다.
func _check_storage() -> void:
	var path := "user://test_storage_%d.save" % Time.get_ticks_usec()
	var storage := MpFileStorage.new(path)

	_check(storage.read().is_empty(), "없는 파일을 읽으면 비어 있다")
	_check(storage.write({"best_seconds": 12.5}), "쓰기가 성공한다")
	_check_eq(float(storage.read().get("best_seconds", 0.0)), 12.5, "쓴 값을 그대로 읽는다")

	_check(storage.write({"best_seconds": 9.0}), "덮어쓰기가 성공한다")
	_check_eq(float(storage.read().get("best_seconds", 0.0)), 9.0, "덮어쓴 값을 읽는다")
	_check(FileAccess.file_exists(path + MpFileStorage.BAK_SUFFIX), "직전 내용이 .bak 로 남는다")
	_check(not FileAccess.file_exists(path + MpFileStorage.TMP_SUFFIX), "임시 파일이 남지 않는다")

	# 정본이 깨져도 직전 세대로 돌아갈 수 있어야 한다.
	var broken := FileAccess.open(path, FileAccess.WRITE)
	if broken != null:
		broken.store_string("{ 이건 JSON 이 아니다")
		broken.close()
	_check_eq(float(storage.read().get("best_seconds", 0.0)), 12.5, "정본이 깨지면 .bak 으로 되돌린다")

	DirAccess.remove_absolute(ProjectSettings.globalize_path(path))
	DirAccess.remove_absolute(ProjectSettings.globalize_path(path + MpFileStorage.BAK_SUFFIX))


## 라이브 콘솔에서 재확인한 ID를 넣은 뒤에는 두 네이티브 포트가 같은 설정 파일을 읽어야 한다.
## 실제 결과 팝업의 버튼 노출은 play_through.gd 가 한 판을 끝낸 뒤 다시 확인한다.
func _check_native_leaderboard_configuration() -> void:
	_check(MpGooglePlayLeaderboard.has_configured_ids(), "Play Games ID 두 개가 구성됐다")
	_check(MpGameCenterLeaderboard.has_configured_id(), "Game Center ID 가 구성됐다")
	_check(not MpGooglePlayLeaderboard.new().is_available(), "헤드리스에는 Android Play Games singleton 이 없다")
	_check(not MpGameCenterLeaderboard.new().is_available(), "헤드리스에는 iOS Game Center singleton 이 없다")


## 콘솔 ID 와 네이티브 singleton 이 있어도, 인증 결과 전에는 결과 화면에 쓸 수 없다.
## 플랫폼 가드는 실제 headless 실행을 계속 막고, 아래 fake는 iOS/Android 인증 신호만 분리한다.
func _check_native_leaderboard_authentication() -> void:
	var fake_game_center := FakeGameCenter.new()
	var game_center := MpGameCenterLeaderboard.new(fake_game_center)
	_check(fake_game_center.authenticate_calls == 1, "Game Center 인증을 시작한다")
	_check(not game_center.is_authenticated(), "Game Center 인증 전에는 false 다")
	_check(not game_center._is_available_on(Platform.Surface.IOS), "Game Center 인증 전에는 iOS 순위표를 열지 않는다")
	fake_game_center.authenticated.emit(true, "")
	_check(game_center.is_authenticated(), "Game Center 인증 성공 뒤에만 true 다")
	_check(game_center._is_available_on(Platform.Surface.IOS), "Game Center 인증 성공 뒤에 iOS 순위표를 연다")
	fake_game_center.authenticated.emit(false, "missing entitlement")
	_check(not game_center.is_authenticated(), "Game Center 인증 실패는 다시 false 다")
	_check(not game_center._is_available_on(Platform.Surface.IOS), "Game Center 인증 실패 뒤에는 iOS 순위표를 닫는다")

	var fake_play_games := FakePlayGames.new()
	var play_games := MpGooglePlayLeaderboard.new(fake_play_games)
	_check(fake_play_games.authentication_checks == 1, "Play Games 로그인 상태를 조회한다")
	_check(not play_games.is_authenticated(), "Play Games 응답 전에는 false 다")
	_check(not play_games._is_available_on(Platform.Surface.ANDROID), "Play Games 응답 전에는 Android 순위표를 열지 않는다")
	fake_play_games.userAuthenticated.emit(true)
	_check(play_games.is_authenticated(), "Play Games 로그인 성공 뒤에만 true 다")
	_check(play_games._is_available_on(Platform.Surface.ANDROID), "Play Games 로그인 성공 뒤에 Android 순위표를 연다")
	fake_play_games.userAuthenticated.emit(false)
	_check(not play_games.is_authenticated(), "Play Games 로그인 거절·실패는 false 다")
	_check(not play_games._is_available_on(Platform.Surface.ANDROID), "Play Games 로그인 거절·실패 뒤에는 Android 순위표를 닫는다")


## 번역 키가 화면에 그대로 노출되는 것을 막는다. CSV 를 직접 읽어 모든 키를 본다.
func _check_translations() -> void:
	var file := FileAccess.open("res://i18n/translations.csv", FileAccess.READ)
	if file == null:
		_check(false, "번역 CSV 를 읽을 수 있다")
		return

	var keys: Array[String] = []
	var header := file.get_csv_line()
	_check(header.size() >= 3 and header[0] == "keys", "번역 CSV 머리글이 keys,ko,en 이다")
	while not file.eof_reached():
		var row := file.get_csv_line()
		if row.size() >= 3 and not row[0].is_empty():
			keys.append(row[0])
			_check(not row[1].is_empty(), "%s 에 한국어 문구가 있다" % row[0])
			_check(not row[2].is_empty(), "%s 에 영어 문구가 있다" % row[0])
	file.close()
	_check(keys.size() > 0, "번역 키가 하나 이상 있다")

	var original := TranslationServer.get_locale()
	for locale in Locale.SUPPORTED:
		TranslationServer.set_locale(locale)
		var missing: Array[String] = []
		for key in keys:
			if tr(key) == key:
				missing.append(key)
		_check(missing.is_empty(), "%s 로케일에 빠진 번역이 없다: %s" % [locale, ", ".join(missing)])
	TranslationServer.set_locale(original)


func _check(condition: bool, label: String) -> void:
	_checks += 1
	if not condition:
		_failures.append(label)


func _check_eq(actual: Variant, expected: Variant, label: String) -> void:
	_checks += 1
	if actual != expected:
		_failures.append("%s — 기대 %s, 실제 %s" % [label, expected, actual])
