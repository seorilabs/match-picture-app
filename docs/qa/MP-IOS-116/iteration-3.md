# MP-IOS-116 UI 검수 3회차

## 실행 전 계획

- 설계 MP-IOS-116 v1, 사용자 승인 `b8ed807c73bd7b8769d101aecc8fbe89cc6b2f07`.
- 제품 후보 `02e63ae229f687a0c0790ddec1de731e9373cd90`. 구현자 `/root`, 독립 검수자 `/root/ui_review`. 페르소나: 최초 설치와 기록을 남긴 재방문 사용자.
- 계획 시각: 2026-10-11T13:02:41.609311+00:00. 아래 계획을 먼저 기록하고 실행한다. [2회차](iteration-2.md) 종료 후 작성했다. 이번이 승인된 마지막 UI 회차이며 4회차·무제한 재시도는 하지 않는다.
- 격리 폴더 `mp-ios-116-ui-round-3-02e63ae`, 전용 game user dir 이름 `match-picture-MP-IOS-116-round-3-02e63ae`. 폴더가 새로 생성되는지 확인하고 원래 사용자 저장을 열거나 변경하지 않는다.
- 앱은 고유 bundle `com.seorilabs.matchpicture.uiqa` / `Match Picture UI QA.app`. 앱 옆 `_sc_`와 self-contained receipt는 구현자가 준비했다. 첫 Run 전에 실제 `EditorInterface.get_editor_paths().is_self_contained()` 및 config/cache가 앱 전용 `editor_data` 안인지 확인한다. 게임 guard autoload는 Save보다 앞에 배치하고 실제 `ProjectSettings.globalize_path("user://")`가 회차 이름인지 확인 후 저장에 진입한다. 불일치하면 실행을 중단한다.
- archive의 **정상 제품 main 씬**을 실행한다. 이번 회차는 Save/광고/analytics 포트를 바꾸지 않는다. sandbox의 메모리 저장 성공은 이번 디스크 근거에 사용하지 않는다.
- 격리 복사본 project.godot에는 전용 저장, 창 크기, 기존3개+환경 runner, 저장 경로 guard/실제 viewport 캡처 helper만 반영한다. 원본 후보 project.godot 보존·SHA·정확한 diff, helper/plugin/앱 receipt 해시를 남긴다. 제품 worktree/제품 및 QA 소스는 수정하지 않는다.
- self-contained Editor prefs에서 공식 `run/window_placement/game_embed_mode=-1`(Disabled)을 첫 Run 전에 설정해 독립 게임 창을 쓴다. 실제 Editor/게임 로그·창·viewport PNG 치수를 확인해야 세 비율을 통과시킨다. 환경 실행은 공식 EditorInterface play_main_scene 한 번을 각 Editor 시작에서 사용한다. remote debug/language server 포트도 격리 prefs에서만 충돌 없는 값으로 지정한다.
- 정상 main **총 3회 Editor Run, 두 번 종료/재시작** 상한: (1) 324×720 좁은 세로 화면, 실제 한 판 완료·디스크 저장, (2) 405×720 일반 세로 비율, 재시작 보존, (3) 540×720 넓은 비율, 확인한 .bak 복구. 원인 불명 실행 차단이나 치수 미적용이면 결과를 미검증으로 보존하고 상한을 늘리지 않는다.
- 캡처 helper는 실제 렌더 viewport를 F7로 저장한다. 게임 값·deck·시간·저장 데이터를 주입하지 않는다. desktop에는 원래 Escape/ui_cancel Back 연결이 없으므로 Esc 상태와 실제 Close/No/Yes 흐름을 확인하고 하드웨어 notification/AIT Back은 별도로 구분한다. 구현자가 notification 대역을 승인했다. F6 실제 CUA 키는 제품 main의 NOTIFICATION_WM_GO_BACK_REQUEST로 전달하고 설정/종료 팝업 UX 경로만 확인한다. OS·실기기 Back 성공으로 기록하지 않는다.

| 기능 목록 | 기능 기대 결과 | UX 기대 결과·실제 확인 |
|---|---|---|
| title | 신규 기본값으로 시작, 한 판 완료 후 최고/완료수, 재시작 보존 | 시작·설정 위계, 언어 즉시 반영, 기록 읽기 |
| first-run-tutorial | 정상 main의 최초 안내 한 탭 한 단계, 마지막 실제 Start; 재시작 후 반복 없음 | ko/en 설명·심볼 지시, 마지막 배경 탭 오작동 없음 |
| matching-game | 상단 입력 미진행, 하단 실제 10정답 완료, Retry | 카드/공통 심볼 가독성·입력 중복 없음 |
| wrong-answer-and-hint | 실제 오답 잠금·복구·힌트 | 잘못된 탭 피드백과 정답 힌트 구분 |
| timing-and-splits | 실제 진행/완료시간과 열 구간, 첫 완료 실제 신기록 | 현재 판/최고/막대 구분, New Best는 저장 성공 후 표시 |
| record-persistence | **실제 파일** 정상 저장→종료→재시작 동일 최고/횟수; 정상 .bak 읽기→확인한 전용 primary만 손상→재시작 복구 | 타이틀·결과와 디스크 내용 일치, 복구 뒤 허위 초기화/신기록 없음 |
| language-and-sound-settings | SYSTEM/한국어/English 선택·기기언어 해석, 음소거/복원, 재시작 유지 | 선택 강조·키보드 닫기, 세 비율 문구/버튼 잘림 없음 |
| back-and-exit | 결과 Exit→No/Yes 실제 종료; desktop Esc 경로 확인 | 팝업 뒤 입력 차단·취소 원 화면 유지. hardware/AIT 입력은 미검증 |
| safe-area-and-awake | 실제 창 및 PNG 세 비율; desktop inset 0 | 세 비율 타이틀/설정/카드/결과 접근. physical safe area/awake 미검증 |
| native-leaderboards/interstitial-and-privacy/ait-share/analytics | desktop 실제 어댑터 미지원 상태에서 불가능 버튼 숨김·Retry 차단 없음 | 결과에서 동작 가능한 버튼 유지. SDK/프로덕션 전송/실기기 증거로 세지 않음 |

### 실제 파일 저장·복구 절차

1. 게임 저장 guard의 실제 경로 확인 뒤 생성된 `match_picture.save`만 읽는다. 정상 제품 한 판을 실제 카드 탭으로 완료하고 결과·최고·완료수·열 구간을 캡처한다.
2. 완료 뒤 설정을 한 번 정상 저장해 `.bak`에도 확인한 최고/완료수 스냅샷이 들어 있는지 읽는다. 언어/소리 선택 상태도 기록한다. 저장 primary와 .bak의 내용을 원본 증거 파일로 회차 폴더에 복사하고 해시를 남긴다.
3. 실제 결과 Yes로 게임을 종료한 뒤 회차 2번째 Editor Run(405×720)에서 최고·완료수·설정이 보존됐는지 확인한다. 이어 재시작 후 실제 시작/Back 취소·설정의 필요한 UX를 확인하고 자신의 게임/Editor만 종료한다.
4. 경로·primary/.bak 이름과 해시를 다시 확인한 뒤 **이번 회차가 만든 primary만** 불완전 JSON으로 바꾼다. 원래 사용자 데이터와 .bak은 건드리지 않는다. 정상 .bak 스냅샷은 변경 전 확인한 값과 동일해야 한다.
5. 3번째 Editor Run(540×720)에서 정상 .bak의 최고/완료수·설정 복구를 실제 타이틀·설정/파일로 확인한다. 최종 source 일치/환경 diff/로그 오류·캡처 치수와 hash를 기록하고 종료 시각을 남긴다.

## 실행 후 관찰·판정

### Run 1 실제 결과 / 차단

- 후보 02e63ae 정상 main, 실제 Editor PID 85723/게임 PID 86257. self_contained=true, config/cache는 고유 `editor_data` 안, user://는 회차3 이름이며 Save 전 runtime guard가 정상 확인했다. 정확한 원본과 격리 환경 diff 외 제품/QA tracked 소스 차이는 없다.
- Editor prefs game_embed_mode=-1를 기록했으나 첫 Run 프로세스는 여전히 embedded였다. 실제 창/PNG는 323×719, 논리 visible_rect 648×1442. 따라서 독립 창으로 적용됐다고 기록하지 않는다. 작은 세로 비율만 관찰했고 다른 두 비율은 아직 미검증이다.
- 실제 입력으로 신규 타이틀 → 설정 → English → SYSTEM → 한국어 즉시 적용 → English/소리 OFF 저장 → Escape 미연결 → F6 설정 닫기 → F6 종료 팝업 → F6 팝업 닫기를 확인했다. desktop privacy 버튼은 실제 어댑터 미지원으로 숨겨졌다.
- **재현 결함: 최초 안내의 카드/심볼/O/손가락이 보이지 않는다.** 정상 main Start로 안내 1/3·2/3·마지막 단계에 진입했으나 문구/Start만 보였다. 마지막 Start 실제 클릭 후 실제 게임 HUD와 카드도 보이지 않아 완주할 수 없다.
- 최초 runtime 로그에 `ERROR: Condition "!std::isfinite(p_size.x) || !std::isfinite(p_size.y)" is true.` 등이 **11건**, tutorial_overlay.set_stage_rect ← game_screen._layout_cards/_on_stage_resized 경로가 있다. F6 대역 입력 이전부터 발생했다. sandbox 성공을 정상 main 성공으로 대체하지 않는다. 원인을 단정하지 않고 구현자에게 즉시 전달했다.
- 게임 중 F6 notification proxy로 Quit?를 열고 실제 No로 취소한 뒤 다시 F6/실제 Yes로 제품 게임이 종료됨을 확인했다. Yes 후 게임 PID 부재를 확인하고 자기 Editor만 종료했다. notification 입력은 OS·실기기 Back 증거가 아니다.
- 실제 파일에는 설정 `language=en`, `muted=true`, 안내 이후 `has_played=true`가 저장됐으며 best_seconds=0 / clear_count=0 / best_splits=[]다. .bak은 아직 has_played=false인 직전 설정 스냅샷이다. **정상 한 판 완료 저장·완료 기록 재시작 보존·정상 .bak 복구는 수행하지 못했다.** .bak과 사용자 원본을 손상시키지 않았다.
- Run 1 종료: 2026-10-11T13:10:44.336550+00:00. 총 3회 한도 중 1회 사용. 새 후보/다음 진행 조율 전 추가 Run은 시작하지 않는다. 현재 판정은 **실패/차단**이며 9개 core의 최종 전체 통과를 주장하지 않는다.

| 캡처 | 의미 |
|---|---|
| capture-53493-1.png | 신규 기본 타이틀, 저장 최고/완료수 없음 |
| capture-71542-2.png | SYSTEM 선택 뒤 한국어 설정 즉시 적용 |
| capture-87942-3.png | English/소리 OFF 설정, 실제 desktop privacy 버튼 숨김 |
| capture-98782-4.png | F6 설정 닫기 뒤 영어 타이틀 |
| capture-109100-5.png | F6 타이틀 종료 팝업 |
| capture-130675-6.png | 결함: 안내 1/3 문구만, 예시 카드 없음 |
| capture-144591-7.png | 결함: 안내 2/3에도 카드/공통 심볼 표시 없음 |
| capture-186599-8.png | 결함: 안내 마지막에 Start만, 카드/손가락 없음 |
| capture-197359-9.png | 결함: 실제 Start 후 HUD/게임 카드 모두 없음 |
| capture-255159-10.png | 빈 게임 상태에서 Back notification proxy 종료 팝업 |
| capture-265483-11.png | 실제 No 취소 뒤 원 빈 게임으로 복귀 |

증거는 `mp-ios-116-ui-round-3-02e63ae` 폴더의 `run-1-failure-evidence-manifest.json`으로 연결한다. 실제 저장 primary/.bak 읽기 증거는 `run-1-match_picture.save`/`run-1-match_picture.save.bak`이며 raw/public 로그와 실제 PNG·해시를 보존했다. 공개용 로그는 개인 홈 경로를 제거하고 원본 로그 해시와 연결했다.

### 실행 환경 준비 확인

- 실행 전에 고유 앱 `_sc_`/self-contained receipt와 환경 runner/guard를 준비했다. run-1 후보 원본과 환경 diff를 별도 보존했다. 환경 파일 SHA-256은 `environment-run-1-manifest.json`으로 연결한다.
- F6 notification proxy는 구현자 승인에 따라 환경 helper에만 추가했다. 실제 OS Back 대체 시험으로 통과시키지 않는다. debug 31663/language-server 31665 포트가 현재 비어 있는지 실행 전 확인했다.
- 독립 게임 창에서 첫 프레임의 실제 크기와 F7 PNG 비율이 계획과 맞는지 확인하고 CUA 실제 입력 검수로 넘어간다.

- Run 1 실제 Editor 시작 요청: 2026-10-11T13:04:32.523439+00:00. 계획/환경 manifest 작성 뒤 시작한다.


### Run 2/3 실행 전 조정 계획

- 기록 시각: 2026-10-11T13:16:20.999811+00:00. 구현자가 공식 엔진 embedded 초기 창 크기 경로를 조사했으나 일반 Window에서 제품 결함을 재현하지 못했다. Run 1 실제 실패는 보존하며, 근거 없이 제품 guard를 추가하지 않는다. source 후보 02e63ae 그대로다.
- 계획된 남은 **두 번 Run만** 수행한다. Run 2는 saved self-contained prefs의 game_embed_mode=-1이 Editor 최초 로드부터 적용됐는지 확인하고, actual 게임 프로세스에 embedded 인자가 없는 독립 게임 창이어야 검수를 진행한다. 다시 실패하면 추가 Run으로 덮지 않고 중단한다.
- Run 1에서 확인한 회차3 전용 primary/.bak은 원본 증거로 추가 복사·해시 보존한다. 기존 디렉터리는 그대로 보존한다. 새 저장 이름 `match-picture-MP-IOS-116-round-3-run2-02e63ae`가 없음을 먼저 확인하고 프로젝트 환경의 저장 이름/guard만 이 새 이름으로 변경한다. 설정·기록·deck 주입은 없다.
- Run 2 = 405×720. 실제 정상 main 기본값 최초 타이틀/안내, 상단 입력·오답잠금/힌트, 실제 하단 10정답 완료, 첫 신기록·열 구간·실제 파일 저장을 확인한다. 완료 뒤 설정을 한 번 정상 저장해 .bak에도 확인한 최고/완료수 스냅샷이 있는지 읽는다. 실제 Exit/Yes 종료 후 자기 Editor만 종료한다.
- Run 3 = 540×720. Run 2 저장 경로를 재사용한다. 종료 상태와 primary/.bak 경로·원본 값/해시를 확인하고 전용 primary만 불완전 JSON으로 변경한다. 정상 .bak을 보존하고 재시작에서 실제 최고/완료수/설정 복구와 넓은 비율 UI를 확인한 뒤 종료한다.
- **손상 없는 primary 재시작 보존과 324 좁은 비율의 정상 main은 이 두 번으로 확인할 수 없어 최종 미검증으로 유지한다.** UI 4회차나 원래 총 3회 상한 초과는 하지 않는다. 최종 E2E로 핵심 미검증을 우회하지 않는다.
- 제품/QA tracked 소스는 바꾸지 않는다. 독립 창에서 오류가 재현되면 즉시 진행을 중단하고 환경 helper로 실제 Window/viewport와 game-screen/stage/card/HUD의 크기·rect·transform을 읽어 로그로 수집한다. 환경 후보 원본/diff/runner/guard SHA를 실행 전에 보존한다.

- Run 2 실제 Editor 시작 요청: 2026-10-11T13:16:29.895928+00:00. 조정 계획/환경 manifest 작성 뒤 실행한다.


### Run 2 초기 실행 결과 / GUI 입력 차단

- 후보 02e63ae 정상 main, Editor PID 13136 / 게임 PID 13585. 최초 로드 prefs game_embed_mode=-1, actual self_contained/config/cache/user:// guard 정상. 게임 프로세스 인자에 --embedded/--wid가 없으며 정상 main 씬으로 시작했다.
- actual Window 406×720(환경 요청 405×720의 Retina 반올림), visible_rect 812×1440. 읽기 전용 helper에서 safe-area-root/game-screen/tutorial/stage와 두 카드/HUD의 size/rect/transform은 모두 유한하다. runtime ERROR/SCRIPT ERROR 없음. Run 1 embedded 초기 0 크기 현상을 정상 독립 Window에서 재현하지 못했다. 제품 결함으로 원인을 확정하거나 제품 guard를 추가하지 않았다.
- **실제 제품 CUA 입력은 차단됐다.** 고유 app path/bundle 선택은 Editor만 반환하고 native Window 메뉴에도 Editor만 있다. 최신 cua.getState의 QA 항목에는 id/displayName/isRunning만 있고 PID/경로/window 목록/ID가 없다. macOS 제공 getApp 문서는 name/full app path/bundle만 지원하며, Linux/Windows의 window ID 경로에 필요한 listWindows가 이 런타임에는 없다.
- 구현자가 읽기 전용 OS 조회로 Editor와 game이 둘 다 같은 QA bundle에 속함을 확인했다. 같은 bundle의 두 프로세스 중 정확히 game13585를 선택할 공식 CUA 정보/API를 찾지 못했다. 모호한 다른 Godot 이름/bundle에 입력하지 않았고 추가 Run/서명 변경도 하지 않았다.
- 실제 viewport PNG와 제품 버튼/카드 입력·완주·정상 .bak 생성은 아직 미실행이므로 기능/UX 통과로 표시하지 않는다. 기본값 title 게임을 유지하고 구현자와 조율 중이다. Run 3도 아직 시작하지 않았다.
- 현재 근거는 `run-2-current-evidence-manifest.json` / `editor-run-2-public.log` / `game-run-2-public.log`. 실제 초기 Window/rect/transform과 원본/public 로그 SHA를 연결했다. endedAt은 아직 없다.


### 마지막 Run 3 실행 전 조정 계획

- 계획 시각: 2026-10-11T13:25:11.022822+00:00. Run 2는 실제 제품 GUI 입력 차단을 보존한 채 자기 Editor13136/child13585만 종료했다. Run 2 종료 시각도 이 기록과 같다. 이번은 원래 총 3회 상한의 **마지막 1회**이며 실패해도 더 실행하지 않는다.
- 중앙 정본은 Godot Editor Play/Run을 요구하고 스크린샷/코드/headless 단위테스트만의 대체를 금지한다. 마지막 실행은 **headless Editor host → 공식 EditorInterface.play_main_scene → 실제 GUI game child → 독립 CUA 입력/렌더 검수**로 분리한다. headless 단위테스트나 headless 제품 실행으로 표시하지 않는다. child GUI/정확한 앱 바인딩이 성립하지 않으면 실제 기능/UX 차단이다.
- 공식 4.7.2 `editor/run/editor_run.cpp`의 project CLI forwarding과 `main/main.cpp`의 --headless 처리를 읽어 Editor의 headless/display-driver 설정이 child project로 전달되지 않는 것을 확인했다. 이 환경 의도만으로 GUI를 통과시키지 않고 실제 프로세스 인자·renderer/window·CUA 제품 입력을 확인한다.
- source 후보 02e63ae 정상 main 그대로. 새 저장 이름 `match-picture-MP-IOS-116-round-3-run3-02e63ae`가 없음을 먼저 확인한다. 이 전용 이름/guard와 창 요청 540×720만 갱신하고, 기존 headless 제외 조건을 환경 runner에서 이 마지막 Editor host 호출에 한해 해제한다. 제품/QA tracked 소스·Save/광고 포트는 바꾸지 않는다.
- Editor는 같은 공식 고유 QA 앱 실행 파일의 --headless --editor, plugin의 공식 play_main_scene 한 번으로 실행한다. 같은 self-contained config/cache와 전용 user:// 경로를 실제 로그에서 확인한다. GUI child도 headless이거나 모호한 다른 앱으로만 보이면 즉시 차단·종료하고 Run을 추가하지 않는다.
- 성립하면 넓은 비율의 최초 안내·상단 입력/오답잠금/힌트·하단 실제10정답·첫 신기록/10구간·결과 설정·Retry/Back/취소/Yes·SYSTEM/ko/en/음소거·실제 파일 정상 저장과 정상 .bak 내용을 검수한다. 게임 값·시간·저장 seed 주입은 없다. F6 notification proxy는 제품 경로만 검수하며 OS·실기기 Back 증거로 표시하지 않는다.
- **정상 primary 재시작 보존 / 손상 primary의 .bak 재시작 복구 / 좁은 비율 정상 main / 세 비율 실제 GUI 입력 비교는 미검증으로 유지한다.** 마지막 한 번 실행으로 나머지 lifecycle 증거를 만들어 통과시킬 수 없다. 전체 core 검수 완료/최종E2E 통과로 우회하지 않는다.

- Run 3 실제 Editor 시작 요청: 2026-10-11T13:25:23.903366+00:00. 마지막 조정 계획/환경 manifest 작성 뒤 실행한다.


### Run 3 실제 입력·저장 결과 / 회차 종료

- 최종 후보는 `02e63ae229f687a0c0790ddec1de731e9373cd90`이다. 실제 Editor host PID33786은 `--headless --editor`, 환경 plugin은 공식 `EditorInterface.play_main_scene()`를 한 번 호출했고 `is_playing_scene=true`를 기록했다. 실제 제품 GUI child PID33874는 headless/embedded 인자 없이 OpenGL로 렌더링했다. 고유 앱 경로 선택이 이 GUI 게임만 반환하는 것을 확인한 뒤 실제 CUA 입력을 수행했다. **headless Editor host였다는 사실을 보존하며, headless 단위테스트나 스크린샷만으로 실제 입력을 대체하지 않았다.**
- self_contained=true / config·cache는 고유 앱의 `editor_data` / user://는 `match-picture-MP-IOS-116-round-3-run3-02e63ae`임을 Save 전에 실제 로그로 확인했다. 실제 Window·PNG는 **540×720**, 논리 viewport는 1080×1440이다. 초기 모든 layout rect/transform은 유한했고 Editor/제품 runtime 로그의 `ERROR:`/`SCRIPT ERROR`는 각각 0건이다. Run1 embedded 실패는 보존하며 정상 독립 게임 창에서는 재현하지 못했다.
- 최초 기본 한국어 타이틀에서 설정을 열고 English→SYSTEM(한국어)→한국어→English, 소리 OFF를 실제 클릭했다. 선택·문구가 즉시 반영되고 desktop privacy/순위/공유 버튼은 실제 어댑터 미지원으로 숨겨졌다. F6 notification proxy로 설정을 닫았다.
- 정상 최초 안내는 예시 카드·8개 심볼, 공통 심볼 O, 마지막 손가락과 Start가 모두 표시됐다. 한 탭에 한 단계만 진행됐으며 마지막 배경 탭은 게임을 시작하지 않고 실제 Start로 시작했다. 1/3 안내 카드가 없던 Run1 실패는 이 정상 독립 실행의 해소 근거로 연결한다.
- 상단 공통 심볼을 눌러도 count10/0s 상태가 진행되지 않았다. 하단 오답 X 피드백 후 즉시 정답 탭이 잠겨 count10을 유지했고, 잠금 복구 뒤 정답이 정상 진행됐다. 유휴 힌트는 두 카드의 공통 심볼을 O로 표시했다. 실제 하단 카드 탭 **10정답**으로 정상 완료했다. 값·deck·시간·저장 seed는 주입하지 않았다.
- 정상 완료는 HUD0, 결과 **82s / NEW BEST**, 저장 실패 문구 없음이다. 구간 막대는 **9개**이며 아래 실제 파일의 `best_splits` 길이·합계와 일치한다. 결과 설정에서 한국어/소리 ON→F6 닫기로 최고 기록 갱신·다시하기·나가기·설정 문구가 즉시 한국어가 됐다. 다시 English/OFF를 저장하고 Tab→Return으로 닫자 영어 결과가 즉시 표시됐으며 시간/최고/막대는 그대로였다.
- 결과 Exit→Quit?에서 팝업 뒤 Settings 클릭은 차단됐고 실제 No는 같은 82s 결과로 돌아왔다. 결과에서 F6는 종료 팝업을 열고 다음 F6는 팝업만 닫았다. 실제 Retry는 최초 안내를 반복하지 않고 count10/0s/BEST82s 게임으로 즉시 진입했다. 미지원 desktop 광고 때문에 진행이 막히지 않았다. 재시도 게임에서 F6→실제 No 취소 뒤 동일 게임을 유지하고, 다시 F6→**실제 Yes로 종료**했다.
- Yes 뒤 CUA `procNotFound`가 발생했고 실제 game33874 부재를 **2026-10-11T13:36:19.006883+00:00**에 확인했다. 이때 명령행이 회차3 headless Editor인 자기 PID33786만 SIGTERM 했다. 두 PID 부재는 **2026-10-11T13:36:26.408395+00:00**에 확인했다. 종료 관찰과 로그 정리 시각을 구분하며 다른 Godot 앱/프로세스/저장은 건드리지 않았다.
- 원래 승인된 총 **3회 Run 상한을 모두 사용하고 회차를 종료**했다. Run1 실패, Run2 입력 차단, Run3 실제 기능/UX 관찰을 각각 보존한다. 4회차는 미승인/미실행이며 추가 실행하지 않았다.

### 구간 수 문서 작성 오류 정정

원래 실행 전 계획의 ‘열 구간’·‘10구간’은 검수 문서 작성 오류다. 제품 `core/game_state.gd`는 첫 정답 뒤 타이머를 시작하고 이후 9개 구간을 측정하며 `split_bars.gd`도 실제 배열 길이만큼 표시한다. 원래 계획 문구를 이력으로 보존한다. Run3 실제 **10정답 완료 / 파일 구간9 / 결과 막대9**가 규칙과 일치하며 게임 규칙·제품 코드를 수정하지 않았다.

### 실제 정상 파일·백업 근거

확인한 회차3 Run3 전용 디렉터리의 파일만 읽고 원본 증거로 복사했다. 정상 완료 뒤 결과 설정을 실제로 다시 저장했으므로 .bak에도 동일한 최고·완료수·구간 스냅샷이 존재한다. 새 실행이나 손상 주입은 하지 않았다.

| 항목 | primary `run-3-match_picture.save` | backup `run-3-match_picture.save.bak` |
|---|---|---|
| best_seconds / clear_count | 82.8871653333406 / 1 | 82.8871653333406 / 1 |
| best_splits 길이 / 합계 | 9 / 82.8871653333406 | 9 / 82.8871653333406 |
| has_played / language / muted | true / en / true | true / en / false |
| SHA-256 | `8c53e09e46c7c5a636e7d6043f846ed05fa55c71c2c811b230f68f26049a3a0d` | `4d08ee0ba8b1f1bce02bf1b952159fd6e8d16f258a4f6d9f1bd678ba90e7e6a4` |

`best_splits` 실제 값은 `[8.53021788888895, 11.0870370370368, 11.3614647407405, 7.8228136666663, 8.82312899999962, 6.9067056666664, 10.022563444444, 8.75642955556003, 9.576804333338]`이다. primary와 .bak은 완전히 같은 기록을 보존하며 마지막 실제 소리 설정 한 단계만 다르다. **이 읽기 근거는 정상 primary 재시작 보존이나 손상 primary의 .bak 재시작 복구 통과가 아니다.**

### core 9개 최종 기능·UX 판정

| 기능 | 실제 기능·UX 결과 | 남은 미검증 |
|---|---|---|
| title | 정상 기본 타이틀·설정·SYSTEM 해석·즉시 언어 반영 관찰. Retry HUD의 BEST82s와 실제 파일 clear_count1 일치 | 완료 후 정상 main 타이틀의 완료수 표시·재시작 보존 |
| first-run-tutorial | 정상 독립 창 1/3·2/3·마지막 카드/O/손가락/Start, 마지막 배경 탭 무동작, Retry 안내 반복 없음 | 재시작 뒤 안내 재노출 없음 |
| matching-game | 상단 무진행·실제 하단10정답 완주·Retry 확인. 심볼/카드/버튼이 넓은 비율에서 접근 가능 | 좁은 정상 main·중간 비율 실제 입력 비교 |
| wrong-answer-and-hint | 오답 X·즉시 정답 잠금·복구와 O 힌트 구분 확인 | native touch 입력은 별도 gate |
| timing-and-splits | 첫 정답 전0s, 이후 실제 시간 증가, 완료82s/파일82.887165, 9막대/9구간 합계 일치, 성공 후 NEW BEST | 없음(이번 desktop 정상 완료 범위) |
| record-persistence | 실제 FileStorage 첫기록·완료1 저장, 정상 재저장 뒤 .bak 동일기록, UI/파일 일치 | 정상 primary 재시작·손상 primary .bak 복구; sandbox 실패 UI는 [2회차](iteration-2.md)의 별도 대역 근거 |
| language-and-sound-settings | SYSTEM/ko/en·ON/OFF 실제 클릭/즉시 결과 문구, Tab/Return 닫기. primary/bak 값 일치 | 설정 재시작 유지; native 음향/키보드 환경 |
| back-and-exit | 결과 Exit→No, 팝업 뒤 입력 차단, F6 설정/종료 팝업 우선순위, Retry게임 No→Yes 실제 종료 | F6는 제품 notification 대역만. OS hardware/AIT Back 미검증 |
| safe-area-and-awake | 실제 넓은540×720 title/settings/tutorial/cards/result 접근 및 desktop inset0 | 정상 좁은 main·세 비율 실제 입력 비교·physical safe area/awake |

desktop 순위/광고/개인정보/공유 버튼 미지원 숨김과 Retry 무차단은 관찰했으나, 실제 UMP 양식/광고 노출·Game Center·AIT 공유·production analytics 전송은 미검증이다. 이번 회차에서 새로 확인한 정상 독립 창 제품 UI 결함은 없다. **전체 core 및 네이티브 마켓 검수 통과로 판정하지 않는다.**

### 소스·환경 지문

후보 archive의 tracked Godot 파일 **820개**를 최종 격리 복사본과 대조했다. 차이는 다음 둘이다. 제품 worktree의 소스는 검수자가 수정하지 않았으며 동작을 담은 스크립트/QA 소스는 후보와 동일하다. 격리 실행 전체가 후보와 byte 단위 동일하다고 표시하지 않는다.

| 파일 | 후보 SHA-256 | 실제 실행 SHA-256 / 차이 |
|---|---|---|
| `godot/project.godot` | `4d5952ea3b2597c770195fdfbea8b030bf529ce32f17fb68d545e144eff75ea3` | `987632e561a3e581b0a7efa8547ca93c065e46c9f3aa29bb938d0ccf9841820c`; 승인된 저장·창·환경 plugin/guard 설정, `project-environment-run-3.diff` |
| `godot/scenes/main.tscn` | `2c6c5fda931ee43689569f4824f03ef888361d0536f980bfd7fdc6823b1cea08` | `7c6c4fce0247b76d28e0b742a014d013171f8d410fde223d2462439f7d70b9ce`; Editor save_before_run 자동 직렬화로 UID/unique_id 추가·load_steps 메타데이터 제거. 동작 속성 변경 없음 |

main 씬의 후보 원본 `main.tscn.candidate-original`, 자동 직렬화본 `main.tscn.editor-serialized`, 정확한 `main-scene-editor-serialization.diff`, 전체 `source-provenance.json`을 보존했다. 이 자동 변경은 실제 입력 전에 구현자에게 전달하고 환경 근거로 수용됐다. 환경 helper/plugin SHA는 `environment-run-3-manifest.json`, 고유앱·self-contained receipt 및 자기 Editor prefs 지문은 최종 manifest에 연결한다. 공식 소스의 [Editor Run](https://github.com/godotengine/godot/blob/4.7.2-stable/editor/run/editor_run.cpp)과 [CLI 전달](https://github.com/godotengine/godot/blob/4.7.2-stable/main/main.cpp) 근거도 headless host/GUI child 구분에 사용했다.

### Run3 대표 캡처 매핑

아래 파일은 실제 제품 viewport PNG이며 모두540×720이다. CUA native 창 관찰과 실제 입력을 함께 수행했다. 전환 중간 프레임은 안정된 최종 배치 증거로 쓰지 않는다.

| 캡처 | 의미 |
|---|---|
| capture-78680-1.png | 정상 신규 한국어 타이틀 |
| capture-108763-2.png | SYSTEM 선택 뒤 한국어 설정/소리ON |
| capture-117676-3.png | English 설정/OFF/미지원 SDK 버튼 숨김 |
| capture-128601-4.png | 정상 안내1/3의 예시 카드와8개 심볼 |
| capture-139259-5.png | 정상 안내2/3 공통 심볼 O |
| capture-146335-6.png | 정상 마지막 안내의 손가락/START |
| capture-169041-7.png | Start 카드 이동 중간 프레임; 배치 판정 제외 |
| capture-197213-8.png | 실제 오답 X/count10/0s/잠금 |
| capture-215695-9.png | 유휴 공통 심볼 힌트 O |
| capture-263294-10.png | 실제 진행 count5/47s |
| capture-298522-11.png | 마지막 정답 피드백 count1/82s; 완료 전 중간 프레임 |
| capture-552583-12.png | 정상 완료 뒤 한국어 결과 설정/ON |
| capture-557524-13.png | 한국어 최고 기록 갱신82s/막대9/HUD0 |
| capture-565283-14.png | 정상 완료 뒤 영어 결과 설정/OFF |
| capture-582643-15.png | 영어 NEW BEST82s/막대9/HUD0 |
| capture-588917-16.png | 실제 결과 Exit 종료 팝업 |
| capture-600845-17.png | 실제 No 뒤82s 결과 유지 |
| capture-626154-18.png | 실제 Retry count10/0s/BEST82s/안내 없음 |
| capture-626196-19.png | Retry 게임 F6 종료 팝업 |
| capture-631470-20.png | Retry 게임 실제 No 취소 뒤 유지 |

### 증거·최종 미검증

- 실제 실행/환경/저장/PNG/raw-public 로그와 해시는 `mp-ios-116-ui-round-3-02e63ae/final-evidence-manifest.json`에 기록했다. Run1/2 실패·차단 manifest도 같은 폴더에 보존했다. 원본 로그/자기 prefs는 로컬 증거이며 공개용 로그는 개인 홈 경로를 제거하고 원본 SHA와 연결했다.
- Run3 원본 Editor 로그 SHA `43f01d3c4cf1d355e0510e0f05666861f1ce8268da19accf469478f9350767b1`, game 로그 SHA `6d9c68fd2885a1e3cdffa93b4e544cf5d567104530b13ea6325e37e20f33ea88`. 공개용 파일은 `editor-run-3-public.log`/`game-run-3-public.log`이다.
- 증거 정리 시각은 2026-10-11T13:37:55.898960+00:00이며 게임 종료/Editor 종료 관찰 시각과 다르다.
- 세 화면비 근거는 **좁은323×719=Run1 실제 PNG 있으나 정상 main 실패 / 중간406×720=Run2 실제 초기창·layout 로그 있으나 CUA 입력·PNG 없음 / 넓은540×720=Run3 실제 입력·PNG 성공**이다. 세 비율 비교를 모두 통과로 표시하지 않는다. [2회차](iteration-2.md)의323×719 sandbox 성공은 좁은 정상 main을 대체하지 않는다.
- 정상 primary 재시작 보존·손상 primary .bak 재시작 복구·정상 좁은 main·세 비율 실제 UI 비교는 **미검증**이다. 검수자가 파일 손상이나 추가Run을 수행하지 않았다. [4회차 제안](iteration-4-proposal.md)은 사용자 승인 전 미실행이며 최종E2E로 이 항목을 우회하지 않는다.

### 저장소에 보존한 공개 증거

검수자 원본 보고서 SHA-256은 `26de6c5ceca52a4123d62dc61bb4d36c6a407e5e28c8064345ab8003b704e6a3`, 원본 최종 manifest는 `180082a0531d24fed3ad5d549a80878f39d1f7add45895cadc36bed3e46a75cc`이다. 회차 종료 뒤 구현자가 이 링크만 추가했다. 공개용 텍스트의 절대 개인 경로만 정규화하고 실제 PNG31개·저장·소스 bytes는 그대로 보존했다. 원본 manifest의 해시는 검수자 artifact 기준이며, 저장소 공개 파일의 해시는 [공개 변환 provenance](evidence/round-3/publication-provenance.json)에서 별도로 확인한다. 원본 로그와 원본 Editor prefs는 local-only다.

- [최종 실행·저장·캡처 manifest](evidence/round-3/final-evidence-manifest.json), [Run1 실패](evidence/round-3/run-1-failure-evidence-manifest.json), [Run2 입력 차단](evidence/round-3/run-2-current-evidence-manifest.json).
- [실제 정상 게임](evidence/round-3/godot/build/review/capture-215695-9.png), [한국어 신기록 결과](evidence/round-3/godot/build/review/capture-557524-13.png), [영어 결과](evidence/round-3/godot/build/review/capture-582643-15.png), [Retry](evidence/round-3/godot/build/review/capture-626154-18.png).
- [primary](evidence/round-3/run-3-match_picture.save), [.bak](evidence/round-3/run-3-match_picture.save.bak), [제품 runtime 로그](evidence/round-3/game-run-3-public.log), [Editor 로그](evidence/round-3/editor-run-3-public.log).
- [소스 비교](evidence/round-3/source-provenance.json), [격리 설정 diff](evidence/round-3/project-environment-run-3.diff), [Editor 씬 메타데이터 diff](evidence/round-3/main-scene-editor-serialization.diff).
