extends Node
## 창 전체 테마와 폰트를 붙인다.
##
## **이것을 `project.godot` 의 `gui/theme/custom_font` 로 두면 안 된다.**
## Godot 은 부팅 시점에 그 폰트를 로드하는데, 갓 체크아웃한 저장소에는 아직
## `.godot/imported/*.fontdata` 가 없다. 그래서 첫 실행이 이런 오류를 남긴다.
##
##   ERROR: Cannot open file 'res://.godot/imported/DoHyeon-Regular.ttf-....fontdata'
##   ERROR: Error loading custom project font 'res://assets/fonts/DoHyeon-Regular.ttf'
##
## Godot 은 그래도 exit 0 으로 끝나지만 CI 로그 게이트는 `ERROR:` 를 실패로 처리한다.
## `.godot/` 를 커밋하지 않으므로 CI 는 매번 clean 이고, required check 가 영원히
## green 이 될 수 없다. import 가 끝난 뒤인 autoload 시점에 붙이면 순서 문제가 사라진다.

## 단어 라벨용. 한국어와 영어 모두 이 폰트를 쓴다.
const WORD_FONT_PATH := "res://assets/fonts/DoHyeon-Regular.ttf"

## 숫자와 기호 전용. 원본 Unity 의 8비트 느낌을 타이머·덱 카운터·기록·O/X 에만 남긴다.
## 한글 글리프가 없으므로 단어에 쓰면 두부(□)가 된다. fallbacks 로 막아 둔다.
const PIXEL_FONT_PATH := "res://assets/fonts/PressStart2P-Regular.ttf"

const DEFAULT_FONT_SIZE := 34

var theme: Theme
var word_font: Font
var pixel_font: Font


func _ready() -> void:
	word_font = _load_font(WORD_FONT_PATH)
	pixel_font = _build_pixel_font()
	theme = _build_theme()

	var root := get_tree().root
	if root != null:
		root.theme = theme

	# AcceptDialog 같은 Window 계열과 draw_string(get_theme_default_font()) 경로까지 덮는다.
	# 테마만 붙이면 그쪽이 시스템 폰트로 떨어져 한글이 깨진다.
	if word_font != null:
		ThemeDB.fallback_font = word_font


func _load_font(path: String) -> Font:
	if not ResourceLoader.exists(path):
		push_warning("폰트가 없다: %s. 시스템 폰트로 떨어진다." % path)
		return null
	var loaded: Variant = ResourceLoader.load(path)
	if loaded is Font:
		return loaded
	push_warning("폰트를 Font 로 읽지 못했다: %s" % path)
	return null


## 픽셀 폰트에 한글 폴백을 달아 둔다. 숫자 전용으로 쓰기로 했지만, 나중에 누가
## 단어 라벨에 실수로 붙여도 글자가 사라지는 대신 도현체로 그려지게 하는 안전장치다.
func _build_pixel_font() -> Font:
	var base := _load_font(PIXEL_FONT_PATH)
	if base == null:
		return word_font
	if word_font == null:
		return base
	var variation := FontVariation.new()
	variation.base_font = base
	variation.fallbacks = [word_font]
	return variation


func _build_theme() -> Theme:
	var built := Theme.new()
	built.default_font_size = DEFAULT_FONT_SIZE
	if word_font != null:
		built.default_font = word_font
	return built
