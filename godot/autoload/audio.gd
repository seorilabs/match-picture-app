extends Node
## 효과음 두 개가 전부다.
##
## 원본 Unity 도 SoundManager 가 AudioSource 2개(정답/오답)만 들고 있었다.
## BGM 은 원본에 없고 기획 정본도 보류로 뒀으므로 넣지 않는다.

const CORRECT_PATH := "res://assets/audio/correct.wav"
const WRONG_PATH := "res://assets/audio/wrong.wav"
const MUTED_KEY := "muted"

var _correct: AudioStreamPlayer
var _wrong: AudioStreamPlayer
var _muted := false


func _ready() -> void:
	_muted = bool(Save.get_value(MUTED_KEY, false))
	_correct = _make_player(CORRECT_PATH)
	_wrong = _make_player(WRONG_PATH)


func is_muted() -> bool:
	return _muted


func set_muted(muted: bool, persist: bool = true) -> bool:
	_muted = muted
	return not persist or Save.set_value(MUTED_KEY, _muted)


func play_correct() -> void:
	_play(_correct)


func play_wrong() -> void:
	_play(_wrong)


func _play(player: AudioStreamPlayer) -> void:
	if _muted or player == null or player.stream == null:
		return
	player.play()


func _make_player(path: String) -> AudioStreamPlayer:
	var player := AudioStreamPlayer.new()
	player.bus = "Master"
	add_child(player)
	if not ResourceLoader.exists(path):
		push_warning("효과음이 없다: %s" % path)
		return player
	var loaded: Variant = ResourceLoader.load(path)
	if loaded is AudioStream:
		player.stream = loaded
	else:
		push_warning("효과음을 AudioStream 으로 읽지 못했다: %s" % path)
	return player
