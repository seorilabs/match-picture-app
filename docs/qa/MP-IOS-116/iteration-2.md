# MP-IOS-116 UI 검수 2회차

## 실행 전 계획

- 설계 MP-IOS-116 v1 / 승인 커밋 `b8ed807c73bd7b8769d101aecc8fbe89cc6b2f07`.
- 후보 SHA `36706599aa9c9101879933de79b7351204f9af04`. 제품/QA 코드 후보 b270b3c와 같으며 1회차 차단 기록·초안만 추가됐다.
- 계획 시각: 2026-10-11T12:21:59Z. 이 계획 기록 후 실제 실행한다.
- 구현자 `/root`, 독립 검수자 `/root/ui_review`, 페르소나 사용자 관점 검수자 / 오류·취소·작은 화면·영어·키보드 집중.
- 환경: macOS Godot 4.7.2 Editor Run. 다른 Godot 작업과 분리한 검수용 앱 `mp116-godot-ui-_zc8d_lb` 안의 `Match Picture UI QA.app`, bundle `com.seorilabs.matchpicture.uiqa`. 원본 실행 파일 미변경·복사 전 SHA 및 ad-hoc 검수 복사본 정보는 같은 폴더 `receipt.json`에 있다. 다른 Godot 앱·입력·설정·프로세스는 조작하지 않는다.
- 격리 프로젝트 `mp-ios-116-ui-round-2-3670659/godot`에 해당 후보 git archive. override.cfg는 QA 씬, 회차 전용 custom user dir, 작은 창 324×720을 지정한다(648×1440 비율). 실제 창을 405×720 및 540×720으로 바꿔 다른 목표 비율도 관찰한다.
- 격리 저장 `match-picture-MP-IOS-116-round-2-3670659`; QA 씬은 메모리 저장 및 광고/UMP 대역을 쓴다. 원래 저장/계정에 접근하지 않는다.
- 증거: 격리 프로젝트 `build/review/`, 회차 루트 `editor.log`, manifest SHA-256, 실제 CUA 입력/관찰. F7 캡처는 실제 실행 결과 보조 증거이며 캡처만으로 실제 Run을 세지 않는다.
- 순서: 고유 앱의 Editor 실행 → 실제 F5/Run → 타이틀 설정/영어/음소거/프라이버시 필요·busy·오류·완료 → 최초 안내·오답·힌트·상단 입력 차단·실제 하단 10정답 → 시간/구간/기존 기록과 완료 수 → 결과 설정/언어/Retry → F2 저장 실패로 10정답 완료·짧은 알림/기존 기록 유지 → 종료 취소/복귀·키보드 → 비율 관찰.
- 통과 기준: 기능과 UX 모두 기대와 같고 제품 오류 로그가 없어야 한다. 1회차의 초기 파싱/환경 차단은 보존하며 실제 실행 해결 시 이번 회차 결과 링크로 연결한다. 네이티브 UMP/광고 노출·Game Center·실기기 safe area/awake·AIT 공유·프로덕션 계측은 대역/에디터 근거로 통과 처리하지 않는다. 새로운 실행 환경 차단은 한정 확인 후 그대로 남긴다. 3회차는 시작하지 않는다.

| 기능 목록 | 기능 기대 결과 | UX 기대 결과 | 오류/복구·증거 |
|---|---|---|---|
| title | 기존 최고 24.6s/3회, 시작·설정 유지 | 주요/보조 버튼 이해와 터치 영역 | 타이틀 캡처, 설정 입력 관통 없음 |
| language-and-sound-settings | ko/en/auto, 음소거, 즉시 언어 반영 | 작은 화면/영문 잘림 없음·선택 이해·키보드 초점 | 상태 캡처, 닫기/재열기 |
| interstitial-and-privacy (대역) | 필요 조건·늦은 상태·busy 중복 차단·실패/완료 | 오류가 짧고 진행을 막지 않음 | F1/F3/F4, settings 캡처/로그 |
| first-run-tutorial | 한 탭 한 단계, 마지막 시작 | 영어 설명과 심볼 지시 이해 | 1/3·2/3·마지막·시작 관찰 |
| matching-game / wrong-answer-and-hint | 상단 미입력, 하단 실제 탭·오답잠금·힌트·10회 완료 | 오답/정답/힌트 구분 및 카드 가독성 | 실제 입력과 중간/결과 캡처 |
| timing-and-splits / record-persistence | 시간/10구간·완료수 증가, 실패 때 기존 최고/횟수 유지 | 이번 판과 저장 최고·실패 안내 명료 | 정상·실패 결과/F8 타이틀 |
| back-and-exit | 설정 닫기, 종료 취소, Retry 즉시 시작 | 원 화면 유지·팝업 입력 차단 | 실제 종료/취소/Retry |
| safe-area-and-awake | 에디터 인셋 0·화면비별 레이아웃 | 카드/버튼/본문 잘림 없이 읽기 | 실제 창 비율; 기기 인셋/awake 미검증 |
| native-leaderboards / ait-share / analytics | 지원되지 않는 버튼 숨김·외부 전송 없음 | 불가능한 버튼 미노출 | 결과/로그 관찰; 실제 SDK는 별도 미검증 |

## 실행 후 관찰·판정

- 실제 Run 후보: `02e63ae229f687a0c0790ddec1de731e9373cd90`. 초기 3670659 환경 전달 실패는 아래 그대로 보존했다.
- 실제 Run 시작 준비 기록: 2026-10-11T12:38:20Z. 실제 게임/제품 입력은 그 뒤 수행했다. 종료: **2026-10-11T12:57:51.857431Z**.
- 실제 Editor PID 24047 / 게임 PID 24300. 고유 앱에서 공식 EditorInterface 실행 후 `is_playing_scene=true`, 게임 창과 실제 CUA 제품 입력을 확인했다. Editor와 게임 각각 실제 user://가 회차 전용 이름인지 확인했고, 게임의 경로 guard는 Save보다 먼저 실행됐다.
- 종료 전 후보의 tracked godot 파일 전체를 비교해 `godot/project.godot`의 기록된 환경 차이만 발견했다. 제품/QA 소스는 원본 후보와 동일했다. Editor와 게임 로그에 `SCRIPT ERROR` / `ERROR:`가 없다. 게임 창은 실제 CUA로 닫았고 남은 우리 Editor만 종료했다.
- **판정: 실제 Editor 실행·입력 범위는 정상. 전체 검수 통과는 아직 선언하지 않는다.** 재현된 제품 결함은 없다. 정상/실패 저장은 이번 회차의 메모리 대역 근거이며, 실제 디스크 재시작과 backup 복구·나머지 두 비율은 3회차로 이어진다. 물리 SDK·하드웨어 back/safe area/awake는 미검증이다.

| 기능 | 기능 결과 | UX 결과 / 증거 | 판정의 한계 |
|---|---|---|---|
| title | ko/en 타이틀, BEST 24s, 시작·설정·완료수 표시 | 주요 시작과 보조 설정 구분, 설정에서 즉시 언어 반영 | 메모리 초기 3회 → 정상 판 후 4회 → 실패 판 후 4회 |
| language-and-sound-settings | 영어 선택/소리 OFF, 마지막 한국어/ON 복원 | 선택 강조·재열기 상태·버튼 잘림 없음, Tab→Return으로 닫기 | SYSTEM 선택 동작·실제 청각 효과는 이번 회차 별도 확인하지 않음 |
| interstitial-and-privacy | 처음 숨김; 늦은 필요 상태 F1에 즉시 노출; 실제 요청 중 Opening 비활성; F4 실패; 재요청/F3 완료 | 작은 창에서 오류 두 줄로 읽힘; 닫기 접근 유지; 오류 제거/버튼 복구 | 실제 UMP/광고는 FakeAdMob callback 대역, 초기 실제 SDK 동의 갱신은 미검증 |
| first-run-tutorial | 1/3 → 2/3 → 마지막; 마지막 배경 탭으로 시작 안 됨; Start 탭으로 게임 시작; 다음 판 재노출 없음 | 영어 설명·O 표시·손가락 지시·시작 버튼 관찰 | 실제 최초 실행 화면 입력, 디스크 재시작 미검증 |
| matching-game | 상단 정답 탭으로 진행 안 됨; 하단 실제 정답 10회로 완료 | 움직임 뒤 안정화된 카드와 숫자/타이머 읽힘 | normal 152s, fail 170s 두 판; Retry 세 번째 판은 시작 후 중단 |
| wrong-answer-and-hint | 하단 오답 후 즉시 정답 탭은 잠금 중 진행 안 됨; 복구 후 정답; 두 카드 공통 심볼 힌트 | 빨간 오답 표시와 녹색 힌트/정답 구분 | 검수자의 심볼 오인 탭은 제품 결함으로 기록하지 않음 |
| timing-and-splits | 진행 시간 증가·완료 시 정지, 9개 측정 구간 막대, BEST 24s 유지 | 이번 판 152s/170s와 최고·실패 문구 구분 | 빠른 신기록 갱신은 실제 입력으로 확인하지 않음 |
| record-persistence | 정상 10정답 후 메모리 완료수 4; 실패 시 기존 최고와 4회 유지 | 실패 결과 Record not saved. 짧은 빨간 문구; 게임 완료/다음 판 막지 않음 | **디스크 저장/재시작/.bak 복구 아님** |
| back-and-exit | 결과 Exit에서 Quit?; 뒤 Settings 탭 차단; No로 원 결과 유지; Retry 즉시 시작 | 취소 후 원 화면 유지, 팝업 입력 관통 없음, 광고 준비 안 됨이 재시도 막지 않음 | Yes 종료 및 OS 하드웨어 back은 이번 회차 미검증. 검수 종료는 native 창 닫기 |
| safe-area-and-awake | 실제 viewport 323×719, Editor 인셋 0 | 좁은 세로 화면에서 설정/오류/결과/카드 잘림 없음 | 405×720/540×720 실제 변경 확인 실패; 기기 안전영역/awake 미검증 |
| native-leaderboards / ait-share / analytics | desktop에서 순위·공유 버튼 안 보임 | 지원 불가 버튼이 결과에 없고 Retry/Exit/Settings 접근 유지 | native 서비스·실제 광고 노출·AIT 공유·live 계측 미검증 |

대표 캡처는 아래 실제 viewport PNG이며 모두 323×719이다. 게임 애니메이션 도중 찍힌 249509/736986은 전환 증거이며 안정 상태 레이아웃 대표로 사용하지 않는다.

| 캡처 파일 | 실제 장면 의미 |
|---|---|
| capture-81908.png | 한국어 설정, privacy 필요 후 버튼 노출, 소리 ON |
| capture-110699.png | 영어 설정/소리 OFF, privacy Opening 비활성 |
| capture-118541.png | 영어 privacy 실패 오류·줄바꿈 |
| capture-126157.png | privacy 완료 후 오류 제거·버튼 복구 |
| capture-136958.png | 영어 타이틀, BEST 24s/3 CLEARS |
| capture-186219.png | 영어 최초 안내 1/3 |
| capture-219200.png | 최초 안내 2/3, 공통 심볼 표시 |
| capture-227742.png | 안내 마지막, 손가락과 Start 버튼 |
| capture-271551.png | 안정된 실제 게임 시작, 10/0s |
| capture-283125.png | 하단 오답 빨간 표시·입력 잠금 |
| capture-360410.png / capture-435918.png | 실제 정답 진행 중 7개/2개 남음, 시간 증가 |
| capture-467318.png | 정상 완료 152s, BEST 24s, 9개 측정 구간·Retry/Exit/Settings |
| capture-483010.png | 정상 완료 후 타이틀 4 CLEARS |
| capture-507394.png / capture-654919.png | 저장 실패 대역 판 실제 플레이, 10개/3개 남음 |
| capture-690543.png | 저장 실패 완료 170s, Record not saved. |
| capture-712386.png | 실제 Quit? Yes/No와 뒤 입력 차단 |
| capture-736986.png | Retry 직후 카드 진입 애니메이션 |
| capture-763178.png | 실패 후 타이틀 여전히 4 CLEARS/BEST 24s |
| capture-1066845.png | 마지막 한국어/소리 ON 복원 설정 |

증거 폴더 이름은 `mp-ios-116-ui-round-2-3670659`. 모든 PNG 크기·파일 SHA-256은 `final-evidence-manifest.json`, 실행 환경 원본/수정본/guard/runner/receipt 해시는 `corrected-environment-manifest.json`, 환경 변경은 `project-environment.diff`로 묶었다. `editor-isolated-run.log` SHA-256 `233c24a9675b82a5c50f086d71f05c32b64fc957c96dadd4a2f13622b841f4b2`, `game-runtime.log` SHA-256 `1213a5206c8a8fa884ced64e43b69c62b683dd7dbd96fc0d66e8d1aa06e36ac2`. raw 로그는 로컬 경로를 포함하므로 공개 보존용 `*-public.log`를 별도 만들고 raw 해시와 연결했다.

## 수정·재확인·남은 문제

1회차 실패를 보존한다. 제품 코드는 검수자가 수정하지 않는다.

### 초기 환경 관찰

- 검수용 고유 앱 `com.seorilabs.matchpicture.uiqa`의 실제 Editor PID `85829`로 바인딩했다. 원본/다른 Godot는 조작하지 않았다.
- 격리 프로젝트의 iOS 플러그인 설치 완료 알림은 실제 Return 입력으로 닫혔고 Editor 창을 확인했다. `editor.log`에 엔진 4.7.2·Apple M3·폰트 임포트 및 SDK 설치 기록이 있다. 현재 SCRIPT ERROR/ERROR 없음.
- F5는 Run으로 전환하지 않았다. CUA 스크린샷이 Editor 영역 1920×988에 흰 여백을 포함한 3840×1976으로 반환되어 1/2 포인트 좌표의 Play 버튼을 한 번 확인했으나 게임 프로세스나 QA 시작 로그가 나타나지 않았다. 실제 제품 입력은 아직 미실행이며 기능/UX 통과로 세지 않는다.
- 2026-10-11T12:28 이후 구현자가 교차 리뷰 지적의 최소 수정 후보를 준비 중이라고 알려 오래된 후보의 전체 기능 검수를 대기했다. 고유 앱 식별자 격리는 성공했지만 실제 Run 전달 문제는 남아 있다. 실행 환경 도구인 EditorPlugin의 공식 EditorInterface Run 경로를 제안했으며 임의로 제품/QA 코드를 수정하지 않았다.

### 1회 한정 실행 환경 도구 확인 계획

- 이 항목은 실제 실행 전에 기록한다. 구현자가 제품 소스 밖 `mp116-editor-runner/plugin.cfg` 및 `plugin.gd`를 준비했다. 아직 새 후보를 받거나 Editor를 재시작하지 않는다.
- 새 후보를 받은 뒤 round-2의 격리 archive를 갱신하고 환경 plugin을 `addons/mp_review_runner/`에 복사한다. override의 editor_plugins/enabled에는 기존 AdMob·Play Games·Game Center와 이 plugin만 명시한다.
- plugin은 실제 GUI Editor의 resource scan 종료 후 공식 `EditorInterface.play_custom_scene("res://tests/review_sandbox.tscn")`를 한 번 호출하고 `is_playing_scene` 결과를 로그로 남긴다. headless 실행은 제외하며 제품 소스·화면·GUI 입력은 바꾸지 않는다. 실제 게임 프로세스/QA 시작 로그/렌더 창까지 확인해야 환경 실행 성공이다.
- source 후보·plugin/override 파일 SHA-256·고유 QA 앱 receipt를 환경 근거로 보존한다. 이 한정 확인 이후에도 게임 Run이나 실제 CUA 입력이 불가능하면 그대로 차단으로 남긴다.
- Run을 해결해도 실제 버튼·카드 입력과 UX 검수는 별도 수행한다. plugin 호출·스크린샷만으로 기능 통과를 세지 않는다. 새로운 회차나 무제한 환경 재시작을 시작하지 않는다.

### 최종 후보 갱신과 한정 실제 실행

- 재시작 전 후보를 `02e63ae229f687a0c0790ddec1de731e9373cd90`으로 고정한다. 구현자가 초기 동의 갱신과 사용자 양식 Opening 상태를 분리하고 부분 파일 쓰기 시 이전 정본 보존을 보완했으며 302개 검사 통과를 전달했다.
- 3670659의 초기 실행 전달 차단 관찰을 보존한다. 이하 실제 제품 검수는 02e63ae만 대상으로 한다. 같은 round-2 프로젝트와 user dir를 사용하고 준비한 환경 runner를 켠 고유 앱에서 한 번 재시작한다.

### 환경 runner 1회 확인 결과

- 2026-10-11T12:35:19Z 계획·후보·환경 manifest 기록 후 Editor PID `17882`로 한 번 재시작했다. `editor-runner.log`에는 엔진/렌더러 시작만 있으며 환경 plugin의 `[review-editor]` 또는 QA 시작 기록/게임 프로세스가 나타나지 않았다. ERROR가 없다고 실제 Run 통과로 판정하지 않는다.
- 초기 설정 오류를 발견했다: 회차 override가 `config/custom_user_dir`를 썼으나 공식 설정명은 `config/custom_user_dir_name`이다. 검수자가 만든 환경 설정의 오류이며 제품 결함이 아니다. 실제 게임이 시작되지 않아 제품 autoload의 저장 접근이나 저장 변경은 아직 없었다. 수정·실제 user:// 경로 확인 전 제품 Run 검수로 진행하지 않는다.
- 별도 runner 활성화가 override를 통해 Editor에 적용되지 않는 것으로 관찰돼 구현자에게 격리 project.godot에 환경 설정만 반영하고 후보 원본과 수정본의 차이·hash를 보존하는 방법을 전달했다. 새로운 제품 코드는 수정하지 않았다. 실제 입력·UX 항목은 여전히 미실행이다.

### 알려진 환경 설정 원인 수정 후 1회 확인 계획

- 구현자가 별도 앱/데이터 격리 요청의 범위에서 환경 수정을 진행하도록 승인했다. 재시작 전에 격리 복사본 project.godot에만 QA main scene, 공식 custom_user_dir_name/use_custom_user_dir, 작은 창, 기존3개+runner plugin을 반영한다. 제품 worktree project.godot은 그대로 둔다.
- 후보 원본 project.godot을 별도 보존하고 정확한 환경 diff 및 원본/수정본 SHA-256을 기록한다. 환경 runner는 Editor의 실제 user:// 경로를 확인한 뒤 Run을 시작하고, 추가 환경 autoload를 Save 앞에 두어 게임 시작 때도 실제 경로가 round-2 전용인지 로그/검사한다. 경로 불일치면 검수 진행하지 않는다.
- 알려진 설정 원인을 고친 뒤 고유 검수 앱 Editor를 한 번만 재시작한다. 실패 시 반복하지 않고 차단으로 보고한다. 성공 시 실제 CUA 제품 입력·UX와 화면 증거를 확인해야 한다.


### 해결 근거와 남은 범위

- [1회차](iteration-1.md)의 초기 QA 파싱/Run 차단 판정은 보존한다. 이번 회차 후보에서는 sandbox가 실제 Editor Run됐고 CUA 버튼/카드 입력을 받았으므로 파싱/Run 환경 차단의 해결 근거로 연결할 수 있다.
- 원본 project.godot SHA-256 `4d5952ea3b2597c770195fdfbea8b030bf529ce32f17fb68d545e144eff75ea3`; 격리 환경 수정본 `b5952cba93dba677be9ff9b6824f8d25db89544a6759a4ae9b70ec3db9ed96c4`.
- 3회차는 별도 후보·사전 계획·새 격리 저장을 기록한 뒤 시작한다. 구현자가 정상 main 세 번의 최초 실행/보존 재시작/backup 복구 재시작에 세 화면비를 묶어 미검증 범위를 확인하는 것으로 조율했다. 메모리 대역 성공을 디스크 성공으로 바꾸어 기록하지 않는다. 이번 회차 종료 시각 전에 3회차 계획이나 실행을 시작하지 않았다.

공개 보존 근거: [22개 실제 캡처·로그·해시 목록](evidence/round-2/final-evidence-manifest.json), [실행 로그](evidence/round-2/editor-isolated-run-public.log), [게임 로그](evidence/round-2/game-runtime-public.log), [환경 diff](evidence/round-2/project-environment.diff). 이미지의 실제 바이트·해시를 복사 후 다시 확인했다. 환경 파일에는 개인 절대 경로 접두어만 치환했고 원본 해시는 별도 provenance에 보존했다.

구간 수 설명 정정: 최초 계획의 `10구간`과 이전 결과 설명의 `열 구간`은 작성 오류였다. `game_state.gd`는 첫 정답 뒤 타이머를 켜며 실제 완료 splits/구간 막대는 9개다. 10정답·11장·원본 타이머 규칙은 유지하고 결과 설명만 바로잡았다.
