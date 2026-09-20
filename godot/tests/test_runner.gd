extends Node
## 엔진 스모크. autoload 가 서고 폰트와 효과음이 실제로 붙었는지 확인한다.
##
## 실행: godot --headless --path godot tests/test_runner.tscn

var _failures: Array[String] = []
var _checks := 0


func _ready() -> void:
	print("[smoke] 시작")

	_check_autoloads()
	_check_surface()
	_check_fonts()
	_check_audio()

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


func _check(condition: bool, label: String) -> void:
	_checks += 1
	if not condition:
		_failures.append(label)
