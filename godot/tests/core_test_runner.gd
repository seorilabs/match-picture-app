extends Node
## 순수 로직 게이트. 게임 조립도, 화면도, 어댑터도 보지 않는다.
##
## 실행: godot --headless --path godot tests/core_test_runner.tscn
##
## 스모크(tests/test_runner.gd)와 역할을 나눈 이유는 실패를 읽을 수 있게 하기 위해서다.
## 덱 규칙이 깨졌을 때 화면이나 어댑터 실패에 섞이면 원인을 로그에서 갈라내야 한다.
## 여기서는 autoload 를 한 번도 건드리지 않는다. 조립이 망가진 상태에서도
## 이 게이트는 코어 규칙의 결과를 그대로 보고해야 한다.

var _failures: Array[String] = []
var _checks := 0


func _ready() -> void:
	print("[core-test] 시작")

	_run_all()

	print("[core-test] 검사 %d건, 실패 %d건" % [_checks, _failures.size()])
	for failure in _failures:
		printerr("[core-test] 실패: %s" % failure)
	get_tree().quit(1 if not _failures.is_empty() else 0)


## Phase 1 에서 덱·라운드·배치·상태기계 테스트가 여기에 붙는다.
func _run_all() -> void:
	pass


func check(condition: bool, label: String) -> void:
	_checks += 1
	if not condition:
		_failures.append(label)


func check_eq(actual: Variant, expected: Variant, label: String) -> void:
	_checks += 1
	if actual != expected:
		_failures.append("%s — 기대 %s, 실제 %s" % [label, expected, actual])
