# MP-IOS-117 독립 UI 검수 준비

- 상태: **승인된 3회 독립 Editor 검수 완료·native gate 차단**. 실행 결과는 회차 보고서와 최종 검수 보고서에 따로 기록했다.
- 승인 설계: [MP-IOS-117 v1](../../design/2026-10-13-ios-1.1.7-ad-privacy/design.md), 승인 대상 커밋 `c92196fab6a302832c4919f71ff745cb3d280db6`.
- 사람 승인: 대화의 `v1 승인 — 수정·검수·재심사 진행`. 설계 문서의 검토 대기 표기는 승인 후 구현자가 갱신한다.
- 구현자: `/root`. 독립 검수자: `/root/privacy_ui_review`.
- 준비 기준: 중앙 `seorilabs/.github` main `793b01669e3a4a3af0502559d86c596c6a3bf468`의 [계약](https://github.com/seorilabs/.github/blob/793b01669e3a4a3af0502559d86c596c6a3bf468/contracts/development-workflow.yaml), [실행 문서](https://github.com/seorilabs/.github/blob/793b01669e3a4a3af0502559d86c596c6a3bf468/docs/agent-governance/development-workflow.md), 회차·E2E 양식.
- 저장소 원격 기본 브랜치 확인: `d2cfb6fbd6c7100ba7f9a72a7a955d959b5ca67f`. 실제 회차 후보는 구현 완료 알림 뒤 다시 고정한다.
- 검수자는 제품 소스·사용자 저장·전역 설정·원래 Godot 앱을 수정하지 않는다. 계획·검수 도구·기록은 이 폴더에 둔다. 새 하위 검수자는 만들지 않는다.

## 공유 실행 환경과 시작 조건

현재 다른 프로젝트의 Godot Editor와 게임이 실행 중이다. 별도 bundle 식별자를 가진 검수 전용 Godot 복사본과 self-contained 설정을 사용해 다른 앱·프로세스에 입력하지 않는다. 구현자에게 후보 준비 알림과 Editor 사용 시간을 받은 뒤 실행한다. iPhone은 구현자가 담당하는 실기기 검수와 별도로 조율하며 이 검수자는 임의로 앱을 설치·삭제하거나 OS 권한을 초기화하지 않는다.

각 회차는 `iteration-1.md`, `iteration-2.md`, `iteration-3.md`에 아래 값을 실행 **전에** 기록한다.

1. 후보 전체 SHA, 승인 설계·조건 ID, 계획 작성 시각과 최대 실행 횟수.
2. 원격 최신 상태, 후보 working tree, 실제 feature inventory와 그 SHA-256.
3. 후보 archive의 파일 manifest, 환경 설정 diff, 검수 plugin·대역·Godot 실행 파일의 SHA-256.
4. 전용 프로젝트·self-contained editor config/cache·사용자 저장 경로, 격리 guard.
5. 실제 창 크기와 기대 화면비, 수행 순서, 증거 경로, 독립 검수자 페르소나.

화면·입력·로그·환경을 함께 확인한다. 제품 행동 소스나 번역의 의미가 후보와 다르면 입력을 멈추고 차이를 보고한다. Editor의 자동 메타데이터 직렬화나 번역 재import는 원본·수정본·정확한 diff와 의미 대조를 남긴다. 전체 바이트 일치를 근거 없이 주장하지 않는다.

## 재현할 실행 방법

1. 고정 후보를 `git archive <candidate> godot`으로 회차 전용 폴더에 풀고 `.godot` 캐시 없이 시작한다. 복사 대상은 git 후보이며 구현 중인 working tree를 묵시적으로 사용하지 않는다.
2. Godot 4.7.2 공식 앱을 전용 복사본으로 준비한다. 원본 실행 파일 지문, 복사본 bundle 식별자·ad-hoc 서명, `_sc_`와 전용 `editor_data` 지문을 기록한다. 전역 Editor 설정을 변경하지 않는다.
3. 격리 복사본 `project.godot`에만 공식 설정 `application/config/use_custom_user_dir=true`, `application/config/custom_user_dir_name="match-picture-MP-IOS-117-round-N-<short-sha>"`를 추가한다. Save보다 앞에 동작하는 검수 guard가 실제 `ProjectSettings.globalize_path("user://")`를 확인해야 한다. 경로가 다르면 Run을 중단한다.
4. Editor 설정은 `run/window_placement/game_embed_mode=-1`로 별도 게임 창을 사용한다. 공유 환경에서 비어 있는 debugger/LSP 포트를 확인해 전용 값으로 지정한다. Editor plugin이 실제 self-contained 경로와 설정을 검증한 뒤 공식 `EditorInterface.play_main_scene()` 또는 승인된 검수 scene Run을 한 번 호출한다.
5. 실제 Editor Run의 게임 child를 PID·인자·bundle 식별자로 확인한다. child는 비headless·비embedded 렌더 창이어야 한다. Editor host에 headless 옵션을 쓴다면 사실을 기록하고 실제 GUI child·입력·렌더 근거를 따로 확인한다. headless 테스트만으로 회차를 세지 않는다.
6. CUA를 전용 앱에 정확히 바인딩하고 실제 버튼·카드 클릭과 키 입력을 수행한다. F7은 현재 viewport 원본 PNG를 보존하는 보조 입력으로만 사용한다. Ctrl+B Back notification 대역은 OS 하드웨어 Back 근거와 구분한다.
7. 각 실행 직전·직후 자기 PID, 창·viewport 치수, 사용자 저장 위치, 실제 소스 지문, 로그를 보존한다. 종료는 제품의 Exit→Yes를 사용하고 이후 자기 PID 부재를 shell로 확인한다. 종료 뒤 CUA 재조회가 Project Manager를 자동 실행할 수 있으므로 이를 새 Run으로 오인하거나 다른 앱을 종료하지 않는다.
8. `SCRIPT ERROR`, `ERROR:`, NaN/비유한 레이아웃을 검사한다. PNG의 실제 크기·SHA-256과 입력·관찰 시각을 연결하고 전환 프레임을 안정 화면의 증거로 사용하지 않는다.

구체적인 실행 명령·포트·경로·helper 지문은 후보가 준비된 뒤 회차 계획에 확정한다. 준비 단계에서 Editor Run을 하지 않는다.

## 개인정보 대역의 범위

기존 `godot/tests/review_sandbox.gd`는 `FakeAdMob`으로 광고 어댑터 전체를 바꾸므로 MP-IOS-117의 실제 개인정보 gate를 확인하는 단독 근거로 사용할 수 없다. 새 검수 환경은 **실제 AdMob 어댑터 상태 로직을 유지**하고 네이티브 ATT, UMP, 광고 초기화·loader·loaded ad만 대역으로 주입한다. 제품 화면·게임 규칙·카드 입력·시간을 대신 실행하거나 조작하지 않는다.

대역에서 읽을 최소 근거는 현재 단계, ATT 상태, UMP `canRequestAds`, 앱 활성 여부, ATT 요청 횟수, 광고 초기화/로드/표시/폐기 횟수, 동의·광고 세대와 이벤트 순서다. 식별자·동의 데이터·개인정보 원문을 로그에 남기지 않는다. 실제 adapter에 테스트 seam이 없는 경우 검수자가 임시 제품 로직을 만들지 않고 구현자에게 요청한다.

- `미결정→허용`, `미결정→거부`, `제한`, 조회 실패, 플러그인 없음, UMP 미완료/오류를 구분한다.
- UMP 창 대기 중·앱 비활성 중에는 ATT를 요청하지 않고, ATT 완료 전 광고 초기화·로드·표시는 0회여야 한다.
- 개인정보 선택 재열기·권한 철회 뒤 이전 광고를 폐기하고 오래된 로드·권한 콜백이 현재 상태를 되돌리지 않아야 한다.
- UMP 필요 없는 지역도 ATT 확인 경로를 통과해야 한다. 허용 뒤 실제 광고 request의 `npa=1`을 확인한다.
- 반복 준비·중복 콜백·재활성화는 중복 창이나 중복 광고 요청을 만들지 않아야 한다.

이 결과는 **Editor 대역 근거**다. Apple 시스템창·UMP 실제 양식·광고 네트워크 통신·iPhone/iPad 화면·실제 ATT 변경의 성공으로 기록하지 않는다.

## 3회 검수 계획

각 회차에서 핵심 기능 전체의 기능과 UX를 확인한다. 아래 집중점은 다른 기능을 생략하는 의미가 아니다. 회차별 한정 실행 수와 시간을 계획에 고정하고 무제한 환경 재시작·동일 회차 반복을 하지 않는다. 발견 문제와 초기 판정을 보존하며 수정 뒤 재확인은 `resolutionEvidence`로 연결한다.

| 회차 | 페르소나와 집중점 | 개인정보 조건 | 게임·UX 및 저장 |
|---|---|---|---|
| 1 | 처음 사용자·요구사항 검수자 | UMP 필요/불필요, 순차 ATT 1회, 대기 중 광고 0회, 허용 뒤 npa 광고 준비와 기존 Retry 표시 | 타이틀·3단계 안내·상단 입력 차단·하단 실제 10정답·오답 잠금·유휴 흔들림·9구간·결과·설정·Retry·정상 파일 저장·종료 |
| 2 | 사용자 관점·오류/취소/작은 화면 | 거부·제한·오류·UMP 미완료·플러그인 없음, 중복 요청, 늦은 실패/완료, 개인정보 Opening/실패·재시도 | 작은 화면 324×720 기준 실측, ko/en/system·소리·키보드 초점·문구 잘림·modal 뒤 입력 차단·게임 전체 완료·광고 없는 Retry·저장 유지 |
| 3 | 반복 사용자·재시작/철회/회귀 | 정상 재실행·활성 복귀 권한 재조회, 허용→거부, 로드 시작/완료/표시 직전 차단, 철회 뒤 늦은 콜백 폐기 | 중간/넓은 화면 405×720·540×720 기준 실측, 정상 기록 재시작, 전용 저장의 백업 복구, 안내 반복 없음·실제 게임 완료·종료·전체 기능 연결 |

예상 치수와 실제 PNG 치수가 1픽셀 달라도 실측값을 기록한다. 큰 글자·native safe area는 OS 실제 설정/기기 근거가 있을 때만 판정하며 Editor의 강제 여백이나 크기 변화는 별도 대역 범위다. 앱에 입력란이 없으므로 키보드 입력란 시나리오는 해당 없다. 접근성은 확인할 수 있는 초점·선택·대비·가독성을 실제 입력으로 확인하고 native VoiceOver는 실제 실행 없으면 미검증이다.

## 전체 기능과 근거 범위

현재 [기능 목록](../feature-inventory.json)은 13개다. 회차 시작 때 후보 목록을 다시 읽고 정의가 바뀌면 표를 갱신한다. 현재 파일에는 `foundation`·`paths`가 없으므로 임의로 30일 승계나 기능 생략을 적용하지 않는다. 이 작업의 광고·권한은 변경받은 기반 기능이며 기존 미검증 광고 결과를 이어받아 통과시키지 않는다.

| 기능 ID | 매회 확인할 Editor 기능·UX | 별도 실제 환경이 필요한 범위 |
|---|---|---|
| title | 시작·설정·기록/완료수·화면 위계 | native 화면비·안전영역 |
| first-run-tutorial | 3단계, 마지막 Start로 시작, 이후 반복 없음 | native 첫 실행 |
| matching-game | 상단 미진행, 하단 10정답, 11장 규칙 보존 | native 터치 |
| wrong-answer-and-hint | X/입력 잠금/복구·하단 정답 좌우 흔들림 | native 입력·성능 |
| timing-and-splits | 첫 정답 뒤 시간 시작, 실제 9구간, 이번/최고 구분 | background/복귀 실제 시간 |
| record-persistence | 정상 파일 저장·정상 재시작·격리 백업 복구 | 기존 사용자 기록 보호·native 파일 |
| language-and-sound-settings | system/ko/en·on/off·저장·초점·잘림 | 실제 오디오·OS 언어·큰 글자 |
| back-and-exit | 설정 닫기·취소·modal 차단·Retry·Yes 종료 | OS 하드웨어 Back/AIT Back |
| safe-area-and-awake | 세 화면비·desktop inset·유한 rect | iPhone/iPad 실제 safe area·awake |
| native-leaderboards | desktop 미지원 버튼 숨김·게임 접근 유지 | 실제 Game Center |
| interstitial-and-privacy | 실제 adapter 로직+SDK 대역, 설정 버튼/상태·게임 진행 | native ATT/UMP/광고 요청·노출·철회 |
| ait-share | desktop 미지원 버튼 숨김 | 실제 AppsInToss 공유 |
| analytics | desktop no-op·게임 진행 방해 없음 | 실제 제공자·전송 검증 |

## 실기기와 최종 gate

- iPhone 12 Pro paired는 사용 가능성만 뜻하며 제품 실행 증거가 아니다. 실제 ATT 미결정·허용·거부, UMP 순서, 테스트 광고, 재실행·설정 변경·철회를 최종 후보와 연결해야 한다.
- 사용자가 iPad 실기기 환경이 없다고 확인했다. iPad 검수는 **미실행**이며 화면 캡처·simulator·Editor를 실기기 근거로 바꾸지 않는다.
- signed app의 native plugin·ATT framework·ko/en 목적 문구, SDK manifest·App Privacy·개인정보 페이지 정합성, 최종 SHA의 전체 기능 E2E·중앙 검증, 업로드·재심사 read-back은 별도 단계다.
- 3회차 후 미충족·주요 결함·미검수 항목이 남으면 추가 회차의 문제·근거·범위·시간·비용·환경·중단 영향을 보고한다. 사람 승인 없이 4회차를 시작하거나 최종 E2E로 UI 미검수를 덮지 않는다.

## 현재 실행 결과

1·2회차는 각각 실제 Editor Run 1회, 3회차는 사전 조율한 서로 다른 4개 시나리오로 완료했다. 후보는 각각 `87658f5`, `5c9d3b3`, `1fc334b`이며 원래 판정을 보존한다. 자세한 결과는 [최종 검수 보고서](independent-review.md)와 각 회차 문서에 있다. 이후 변경된 광고 활성 복귀 경로는 미재확인이다. 실기기 QA는 미실행이며 변경받은 native 광고·권한과 최종 E2E는 blocked다.

기능 목록의 foundation/paths는 구현자가 후속 갱신 중이다. 위의 “현재 파일에는 없음”은 준비 당시 후보 상태를 설명한다. 이 검수는 당시 13개 전체 목록을 사용했고 기존 기반 기능 통과 근거를 승계하지 않았다.
