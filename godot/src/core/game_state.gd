class_name MpGameState
extends RefCounted
## 한 판의 진행 전체.
##
## 노드도 Timer 도 쓰지 않고 advance(delta) 만 받는다. 그래서 헤드리스에서 게임 한 판을
## 통째로 시뮬레이션할 수 있고, 화면이 없어도 규칙이 깨졌는지 확인할 수 있다.
##
## 원본 `Assets/Scripts/GameSceneManager.cs` 의 진행을 그대로 옮겼다.

signal round_started(next_round: MpRound)
signal judged(symbol: String, correct: bool)
signal hint_started()
signal finished(seconds: float)

enum State {
	IDLE,
	PLAYING,
	PULSING,
	PENALTY,
	FINISHED,
}

var _state: State = State.IDLE
var _queue: Array[PackedStringArray] = []
var _current: MpRound = null

var _elapsed := 0.0
var _timer_running := false

var _round_elapsed := 0.0
var _hint_active := false
var _lock_remaining := 0.0

var _correct_count := 0
var _wrong_count := 0


func state() -> State:
	return _state


func current_round() -> MpRound:
	return _current


func elapsed_seconds() -> float:
	return _elapsed


func correct_count() -> int:
	return _correct_count


func wrong_count() -> int:
	return _wrong_count


func hint_active() -> bool:
	return _hint_active


## 정답 펄스와 오답 진동 동안에는 탭을 받지 않는다. 원본이 버튼 8개를 통째로 껐다.
func accepts_input() -> bool:
	return _state == State.PLAYING


## 남은 카드 표시. 시작 10, 정답마다 하나씩 줄어 1, 끝나면 0.
##
## 덱이 11장이라 첫 라운드에서 두 장을 꺼내도 큐에 9장이 남아 9 + 1 = 10 이 된다.
func deck_label() -> String:
	if _state == State.FINISHED or _state == State.IDLE:
		return "0"
	return str(_queue.size() + 1)


func start(rng: RandomNumberGenerator) -> bool:
	_queue = MpDeck.build(MpRules.PRIME, MpRules.TOTAL_CARDS, rng)
	var first := MpRound.take_next(_queue, PackedStringArray())
	if first == null:
		push_error("덱에서 첫 라운드를 만들지 못했다.")
		return false

	_current = first
	_state = State.PLAYING
	_elapsed = 0.0
	_timer_running = false
	_correct_count = 0
	_wrong_count = 0
	_reset_round()
	round_started.emit(first)
	return true


## 심볼 하나를 탭했을 때. 입력이 잠겨 있으면 아무 일도 일어나지 않는다.
func judge(symbol: String) -> void:
	if not accepts_input() or _current == null:
		return

	var correct := symbol == _current.hint
	if correct:
		_state = State.PULSING
		_lock_remaining = MpRules.CORRECT_PULSE_SECONDS
	else:
		_wrong_count += 1
		_state = State.PENALTY
		_lock_remaining = MpRules.WRONG_PENALTY_SECONDS
	judged.emit(symbol, correct)


## 시간을 흘린다. 화면이 있는 쪽에서 _process(delta) 로 부른다.
func advance(delta: float) -> void:
	if _state == State.IDLE or _state == State.FINISHED:
		return

	# 타이머는 첫 정답을 맞힌 뒤부터 흐른다. 오답 잠금 중에도 멈추지 않는다.
	if _timer_running:
		_elapsed += delta

	match _state:
		State.PULSING:
			_lock_remaining -= delta
			if _lock_remaining <= 0.0:
				_finish_pulse()
		State.PENALTY:
			_advance_hint(delta)
			_lock_remaining -= delta
			if _lock_remaining <= 0.0:
				_state = State.PLAYING
		State.PLAYING:
			_advance_hint(delta)


## 힌트는 같은 문제를 푸는 동안 계속 흐른다. 오답으로 잠긴 동안에도 멈추지 않는다.
func _advance_hint(delta: float) -> void:
	_round_elapsed += delta
	if not _hint_active and _round_elapsed >= MpRules.HINT_DELAY_SECONDS:
		_hint_active = true
		hint_started.emit()


func _finish_pulse() -> void:
	# 원본은 첫 정답의 판정 연출이 끝나는 시점에 초시계를 켰다.
	if not _timer_running:
		_timer_running = true

	_correct_count += 1

	var next := MpRound.take_next(_queue, _current.opponent)
	if next == null:
		_state = State.FINISHED
		_timer_running = false
		finished.emit(_elapsed)
		return

	_current = next
	_state = State.PLAYING
	_reset_round()
	round_started.emit(next)


func _reset_round() -> void:
	_round_elapsed = 0.0
	_hint_active = false
	_lock_remaining = 0.0
