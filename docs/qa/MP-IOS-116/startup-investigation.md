# 정상 main 첫 embedded Run 조사

제품 후보는 02e63ae다. 3회차 첫 실제 Editor Run의 [관찰](iteration-3.md)을 보존한다. 최초 창 크기 (0,0), tutorial_overlay.set_stage_rect의 비정상 size 오류 11건, 안내 카드와 게임 HUD/카드 미표시를 확인했다. desktop 알림 대역 입력 전에 발생했으며 이 결과는 실패다.

## 확인한 자료와 자동 조사

- [Godot 4.7.2 Window 소스](https://github.com/godotengine/godot/blob/4.7.2-stable/scene/main/window.cpp)의 `_update_window_size()`는 main window embedded 상태에서 DisplayServer의 창 크기를 다시 읽는다. `_update_viewport_size()`는 실제 창 종횡비에서 논리 캔버스를 계산한다.
- [Control 소스](https://github.com/godotengine/godot/blob/4.7.2-stable/scene/gui/control.cpp)의 `get_parent_anchorable_rect()`와 `_size_changed()`는 부모/viewport 크기를 앵커 계산에 사용한다. `set_size()`는 유한하지 않은 값을 거부한다.
- 별도 프로젝트·사용자 경로의 자동 headless 조사는 일반 Window를 0 크기로 만든 뒤 324×720으로 바꾸고 정상 main을 조립했다. 일반 Window는 최초 (1,1)로 보정됐고 논리 크기는 1440×1440 → 648×1440, 게임 stage는 1440×1340 → 648×1340으로 바뀌었다. SCRIPT ERROR/ERROR 없이 종료했다. 원래 실패의 embedded 0 창 조건을 재현하지 못했으므로 TDD 실패나 실제 UI 통과로 세지 않는다. [조사 코드·로그와 해시](evidence/startup-investigation/provenance.json)를 보존한다.

초기 embedded 창과 관련될 가능성은 있지만, 위 조사만으로 제품 결함 또는 환경 문제라고 확정하지 않는다. 제품에 단순 유한값 guard나 지연을 추가하지 않았다. 기존 실패를 지우거나 추가 회차를 승인 없이 시작하지 않는다.

## 같은 회차의 후속 실제 관찰

Run2는 독립 창406×720의 초기 크기·rect·transform이 모두 유한하고 runtime 오류가 없었다. 같은 bundle의 Editor/게임 두 프로세스를 도구가 구분하지 못해 실제 제품 입력은 차단됐다. Run3는 headless Editor host의 공식 `EditorInterface.play_main_scene()`가 실제 GUI child를 실행했다. 그 GUI 게임만 정확히 식별한 뒤 독립 검수자가 CUA로 입력했고,540×720의 최초 안내·카드·HUD가 정상 표시됐다. 실제10정답 완료·신기록·디스크 저장·설정·Retry·종료를 확인했고 Editor/game의 ERROR/SCRIPT ERROR는0건이다. [Run3 로그·캡처와 실패 보존 manifest](evidence/round-3/final-evidence-manifest.json), [독립 보고서](iteration-3.md)를 연결한다.

이 관찰은 정상 독립 창에서 기존 현상이 재현되지 않았다는 근거다. embedded 최초0 크기의 원인 해결·좁은 정상 main·모든 화면비 통과를 뜻하지 않는다. 마지막 회차의 미검증 항목과 추가 회차 승인 조건은 그대로 유지한다.
