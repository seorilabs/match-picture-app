extends Node
## 기기 언어. Ui 가 테마를 조립하기 전에 로케일이 정해져 있어야 한다.

signal language_changed(locale: String)

const SUPPORTED := ["ko", "en"]
const OPTIONS := ["auto", "ko", "en"]
const STORAGE_KEY := "language"

var _language := "auto"


func _ready() -> void:
	var stored: Variant = Save.get_value(STORAGE_KEY, "auto")
	_language = String(stored) if stored is String and OPTIONS.has(String(stored)) else "auto"
	_apply()


func current_locale() -> String:
	return TranslationServer.get_locale().get_slice("_", 0)


func selected_language() -> String:
	return _language


func resolve_locale(language: String, system_language: String) -> String:
	var requested := system_language if language == "auto" else language
	requested = requested.replace("-", "_").get_slice("_", 0).to_lower()
	return requested if SUPPORTED.has(requested) else "en"


## 저장 실패는 호출한 화면에서 알린다. 이번 실행에서는 고른 언어로 계속 놀 수 있다.
func set_language(language: String, persist: bool = true) -> bool:
	if not OPTIONS.has(language):
		return false
	_language = language
	_apply()
	language_changed.emit(current_locale())
	return not persist or Save.set_value(STORAGE_KEY, _language)


func _apply() -> void:
	TranslationServer.set_locale(resolve_locale(_language, OS.get_locale_language()))
