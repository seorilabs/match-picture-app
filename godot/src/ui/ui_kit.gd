class_name MpUiKit
extends RefCounted
## 화면 부품의 색과 크기를 한 곳에 모은다.
##
## 색은 원본 Unity 에서 뽑은 값이다. 배경 그라데이션은 원본이 1x3 픽셀 PNG 를 늘려
## 쓰던 것이라 이미지를 옮기지 않고 GradientTexture2D 로 다시 만든다.

const BG_EDGE := Color("4594B5")
const BG_CENTER := Color("70CFF7")

const TEXT_LIGHT := Color("FFFFFF")
const TEXT_DARK := Color("143C4E")
const CORRECT := Color("4CD964")
const WRONG := Color("FF3B30")
const PANEL := Color("FFFFFF")
const PANEL_BORDER := Color("4594B5")
const BUTTON := Color("F4D03F")
const BUTTON_TEXT := Color("143C4E")

const FONT_HUD := 36
## HUD 둘째 줄. 최고 기록과 페이스 차이가 여기 들어간다.
const FONT_HUD_SUB := 24
## 심볼 위에 겹쳐 띄우는 O/X 글자 크기. 마크 상자(120px) 안에 들어간다.
const FONT_MARK_SYMBOL := 100
const FONT_RESULT := 96
## 타이틀 화면의 게임 이름. 한국어 다섯 글자가 440 폭 안에 들어가는 크기다.
const FONT_TITLE := 64
const FONT_BUTTON := 40
## 글자 하나만 들어가는 정사각 버튼. 최초 실행 안내의 닫기(X) 가 쓴다.
const FONT_ICON_BUTTON := 48
const FONT_BODY := 34

const PANEL_RADIUS := 24
const PANEL_BORDER_WIDTH := 6

## 카드 배경. 원본은 Unity 기본 UISprite(둥근 사각형)를 흰색 불투명으로 650x650 에
## Simple 로 늘려 썼다. 32px 스프라이트를 20배 늘린 만큼 모서리도 크게 둥글어진다.
const CARD_BG := Color("FFFFFF")
const CARD_CORNER_RADIUS := 162


## 원본 배경. 위아래가 짙고 가운데가 밝은 세로 그라데이션이다.
static func background_texture() -> GradientTexture2D:
	var gradient := Gradient.new()
	gradient.set_offset(0, 0.0)
	gradient.set_color(0, BG_EDGE)
	gradient.set_offset(1, 1.0)
	gradient.set_color(1, BG_EDGE)
	gradient.add_point(0.5, BG_CENTER)

	var texture := GradientTexture2D.new()
	texture.gradient = gradient
	texture.fill_from = Vector2(0.0, 0.0)
	texture.fill_to = Vector2(0.0, 1.0)
	texture.width = 8
	texture.height = 256
	return texture


static func card_style() -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = CARD_BG
	style.set_corner_radius_all(CARD_CORNER_RADIUS)
	return style


## 카드 위에 글자를 얹는 반투명 띠. 흰 카드 위에서도 글자가 읽히게 어둡게 깐다.
static func hint_style() -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = Color(TEXT_DARK, 0.82)
	style.set_corner_radius_all(PANEL_RADIUS)
	style.set_content_margin_all(20.0)
	return style


static func panel_style() -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = PANEL
	style.border_color = PANEL_BORDER
	style.set_border_width_all(PANEL_BORDER_WIDTH)
	style.set_corner_radius_all(PANEL_RADIUS)
	style.set_content_margin_all(28.0)
	return style


static func button_style(fill: Color) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = fill
	style.set_corner_radius_all(16)
	style.set_content_margin_all(18.0)
	return style


## 화면 폭에 맞춰 버튼을 만든다. 터치 목표를 충분히 크게 두려고 최소 높이를 준다.
static func make_button(text: String, fill: Color = BUTTON) -> Button:
	var button := Button.new()
	button.text = text
	button.custom_minimum_size = Vector2(0.0, 96.0)
	button.add_theme_font_size_override("font_size", FONT_BUTTON)
	button.add_theme_color_override("font_color", BUTTON_TEXT)
	button.add_theme_color_override("font_hover_color", BUTTON_TEXT)
	button.add_theme_color_override("font_pressed_color", BUTTON_TEXT)
	button.add_theme_stylebox_override("normal", button_style(fill))
	button.add_theme_stylebox_override("hover", button_style(fill.lightened(0.08)))
	button.add_theme_stylebox_override("pressed", button_style(fill.darkened(0.12)))
	button.add_theme_stylebox_override("focus", StyleBoxEmpty.new())
	# 라벨과 같은 이유로 버튼도 폰트를 직접 지정한다.
	if Ui.word_font != null:
		button.add_theme_font_override("font", Ui.word_font)
	return button


## 기호 하나만 들어가는 정사각 버튼. 원본 닫기 버튼도 100x100 에 글자 하나였다.
static func make_icon_button(text: String, side: float = 100.0) -> Button:
	var button := make_button(text)
	button.custom_minimum_size = Vector2(side, side)
	button.add_theme_font_size_override("font_size", FONT_ICON_BUTTON)
	if Ui.pixel_font != null:
		button.add_theme_font_override("font", Ui.pixel_font)
	return button


## 숫자와 기호는 픽셀 폰트로 그린다. 원본의 8비트 느낌이 남는 곳이다.
static func make_pixel_label(text: String, size: int, color: Color = TEXT_LIGHT) -> Label:
	var label := Label.new()
	label.text = text
	label.add_theme_font_size_override("font_size", size)
	label.add_theme_color_override("font_color", color)
	if Ui.pixel_font != null:
		label.add_theme_font_override("font", Ui.pixel_font)
	return label


## 단어 라벨. 한국어와 영어 모두 도현체로 그린다.
static func make_word_label(text: String, size: int, color: Color = TEXT_DARK) -> Label:
	var label := Label.new()
	label.text = text
	label.add_theme_font_size_override("font_size", size)
	label.add_theme_color_override("font_color", color)
	# Web 내보내기는 Theme.default_font 를 쓰지 않는다. 테마에만 기대면 한글이
	# 코드포인트 상자로 그려진다(네이티브는 멀쩡해서 늦게 드러난다).
	# make_pixel_label 은 원래 직접 지정해서 무사했다. 같은 방식으로 못 박는다.
	if Ui.word_font != null:
		label.add_theme_font_override("font", Ui.word_font)
	return label
