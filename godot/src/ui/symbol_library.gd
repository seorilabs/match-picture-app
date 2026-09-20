class_name MpSymbolLibrary
extends RefCounted
## 심볼 텍스처 57장을 들고 있는다.
##
## 라운드가 넘어갈 때마다 디스크에서 읽으면 첫 프레임에 히칭이 생긴다. 전부 합쳐도
## 128x128 RGBA 57장이라 부팅 때 한 번 올려 두고 끝낸다.

const SYMBOL_DIR := "res://assets/symbols/"

var _textures: Dictionary = {}


func load_all() -> int:
	_textures.clear()
	for i in range(1, MpRules.SYMBOL_POOL_SIZE + 1):
		var name := MpDeck.symbol_name(i)
		var path := "%s%s.png" % [SYMBOL_DIR, name]
		if not ResourceLoader.exists(path):
			push_warning("심볼 텍스처가 없다: %s" % path)
			continue
		var loaded: Variant = ResourceLoader.load(path)
		if loaded is Texture2D:
			_textures[name] = loaded
		else:
			push_warning("심볼을 Texture2D 로 읽지 못했다: %s" % path)
	return _textures.size()


func texture(symbol: String) -> Texture2D:
	return _textures.get(symbol, null)


func count() -> int:
	return _textures.size()
