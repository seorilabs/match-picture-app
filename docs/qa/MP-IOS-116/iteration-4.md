# MP-IOS-116 UI 검수 4회차

## 실행 전 계획

- 설계 MP-IOS-116 v1·AC-1~AC-4, #110/PR#111. 구현자 `/root`, 독립 검수자 `/root/ui_review`. 페르소나: 최초 사용자·기록을 남긴 재방문·손상 저장 복구 사용자.
- 추가1회 승인 관찰 **2026-10-11T22:10:57Z**(한국2026-10-12), 정본 `approval.json`. 승인 [제안](iteration-4-proposal.md) 커밋 `385fa2e3d20c6cc89a790d403301573d48f164f1` / SHA-256 `c1c5975b8f493f625c4b43b70c8a337fad000bcbdaafdc6d21a35349baf667b9`. 원래 설계 승인과 추가회차 승인을 구분한다.
- 후보 `385fa2e3d20c6cc89a790d403301573d48f164f1` 고정. 원격main `04357c7fff0eead3bdc4b6b6c334a7dc810fdb12` read-back 및 준비 전 worktree clean 확인. 제품/QA tracked 코드·규칙·SDK·deck/time/save seed 변경 금지.
- 계획 시각 **2026-10-11T22:14:33.603493+00:00**. 준비 시간은 첫 Editor Run 요청 전까지 따로 기록한다. **최대3회 Run·첫Run요청부터40분**(재시작/복구/종료 포함), 시작 요청 직전 실제시각과 deadline=+40분 기록. 4번째Run/5회차/상한연장 금지; 오류/차단/기한도달은 미검증 보존 후 자기 실행 종료.
- 최신 중앙 계약·실행 문서·iteration양식을 읽었다. [1회](iteration-1.md)/[2회](iteration-2.md)/[3회](iteration-3.md) 실패·차단을 보존하고 이번 actual 근거로만 resolutionEvidence 연결. 최종E2E·nativeQA는 별도다.
- 새archive `mp-ios-116-ui-round-4-385fa2e`, userdir `match-picture-MP-IOS-116-round-4-385fa2e`가 없음을 확인. 같은 저장경로 세Run 재사용. 초기 준비 스크립트가 원본에 없는 설정 키 교체를 기대해 assert로 멈췄다. Editor실행 전 원본을 읽고 격리복사본에 공식키를 추가했으며 환경manifest에 이력을 보존했다. Run횟수 소모/제품변경 없음.
- 공식4.7.2 고유QA앱 `com.seorilabs.matchpicture.uiqa`, 자기 `_sc_`/editor_data config/cache 사용, strict서명 확인. 자기 prefs embed=-1/debug31663/LSP31665 유지. 이전 사용자저장·다른Godot/Simulator/앱/계정 접근·변경 금지.
- 각Run: **headless Editor host --editor→공식 EditorInterface.play_main_scene 1회→비headless·비embedded actualGUI child/OpenGL→고유앱 CUA정확바인딩**. hostheadless 사실 기록; headless단위테스트/PNG만으로 actual입력 대체 금지. 모호하면 입력하지 않고 중단.
- 후보project.godot 원본/exactdiff/hash와 외부 helper/plugin 지문 실행 전 보존. Save앞 guard가 actualuser:// 확인. renderer/프로세스인자/Window/viewport/로그/F7실제PNG 치수 기록. F6는 CUA키→제품Backnotification/팝업UX 대역이며 OS hardware/AITBack 근거 아님.
- Editor자동 save-before-run main.tscn UID/load_steps 메타직렬화 재현 시 원본/직렬화본/exactdiff/hash 보존, 행동동일 확인. 행동소스가 다르면 중단하며 전체byte동일 주장 금지.

| 전체기능 | 기능 기대결과 | UX 기대결과·오류/복구 | 증거 |
|---|---|---|---|
| title | 최초 최고/완료수 없음→정상완료→재시작 보존 | 시작/설정 위계·기록/언어 가독성 | 세비율actualPNG·파일일치 |
| first-run-tutorial | 3단계8심볼/O/손가락/Start·마지막 배경무진행·재시작 반복없음 | 탭 한단계·행동명확 | 좁은정상main 실제입력/PNG |
| matching-game | 상단차단·하단10정답·Retry | 심볼접근·중복진행없음 | count/결과/세비율게임 |
| wrong-answer-and-hint | 오답잠금/복구·유휴O힌트 | X/O구분 | 실제오답/즉시정답잠금·회복 |
| timing-and-splits | 첫정답후측정·10정답/9구간·정상신기록 | 현재/최고/막대9 구분 | 결과/9splits 합계 |
| record-persistence | 정상primary재시작·정상bak복구 | UI/파일일치·허위초기화없음 | guard·원본/해시·손상전후·재시작 |
| language-and-sound-settings | SYSTEM/ko/en·ON/OFF·재시작 유지 | 선택/즉시문구·TabReturn·잘림없음 | 세비율설정·파일값 |
| back-and-exit | 설정닫기·Exit/No/Yes·Retry/Back | 뒤입력차단·취소원상태·실제종료 | actual CUA·ownPID부재,hardware별도 |
| safe-area-and-awake | 세비율실측·desktopinset0 | title/settings/tutorial/game/result 접근 | actualWindow/PNG,physical미검증 |
| 비core4:leaderboards/interstitial-privacy/share/analytics | desktop미지원 숨김/no-op·Retry무차단 | 가능한버튼유지 | actualUMP/ad/GC/AIT/전송claim금지 |

### 순서·저장 보호·통과 기준

1. **Run1=324×720 새저장**. 전체9core title/system/ko/en/sound·안내3단계/cards/O/finger/마지막배경무진행·upper차단/wronglock/recovery/hint·actual10정답·firstbest/9splits. 결과설정/TabReturn/Retry/Back/No/Yes. 완료 뒤 실제설정쓰기하여 normal.bak에도 best/count/9splits 있음을 읽고 원본보존/해시. 실제Yes→game부재→자기Editor종료.
2. **Run2=405×720 동일경로 정상primary그대로**. 실제restarttitle 최고/완료수·설정/구간파일일치·안내반복없음. 중간비율 game/settings/Back/No/필요정상결과 UX 비교. primary/bak값/해시 보존. 실제Yes/ownEditor종료.
3. **Run3=540×720 동일경로**. own경로/primary/bak 정상값·해시를 읽고 원본백업. 이번검수primary만 불완전JSON으로 손상, bak미변경 해시 재확인. 실제restarttitle/설정/파일/로그에 bak best/count/9splits/lang/sound 복구 확인. 넓은비율game/입력/필요core 확인 후 actualYes/ownEditor종료.
4. 항목→actualevidence→functional/UX판정·문제/영향/제안·UTC/deadline·resolution 연결. 전환중간frame을 안정UI근거로 세지 않는다. 3Run/40분안 종료하고 raw/public로그/PNG/저장/source/env/metadata manifest 최종화 및 GUI반환. SDK/hardware/AIT/physicalsafearea/awake는 별도 미검증.

## 실행 후 관찰·판정

위 계획은 제품 실행 요청 전에 기록했다. 아래에는 실행 후 관찰과 판정을 시점별로 덧붙인다.

- Run1 요청/실행 시간 기산 기록: **2026-10-11T22:15:00.631136+00:00**. 절대 deadline **2026-10-11T22:55:00.631136+00:00**. 준비 종료, archive tracked파일 820개 비교: 격리project.godot 외 후보동일; 전용포트비어있음·자기embed=-1 확인. 이 기록 후첫Editor를요청한다.

### Run1 최초 실제 실행·번역 재import 확인

- headless Editor13107→실제 GUI child13138, 고유앱 CUA 선택은 게임 창만 반환했다. 실제 타이틀을 읽었으나 의미 검증 전 제품 입력은 하지 않았다. child는 비headless/비embedded이며 OpenGL, 실제 Window324×720/visible_rect648×1440, user:// guard before Save·self-contained·초기 유한 layout/오류 없음.
- Editor 첫 스캔이 AdMob 공식 iOS 템플릿을 격리 addon에 자동 다운로드했고 CSV 번역을 재import했다. tracked 원본820파일 대조 차이는 project.godot, main.tscn 자동UID메타, translations.en/ko.translation이다. 번역은 RSRC→RSCC 압축 형식 변경으로 실제 문구 의미 동일은 아직 미확인이다. 원본/재import본/해시를 보존했다.
- 구현자가 별도 Save/autoload 없는 최소 resource-only probe로 locale 및 모든 CSV key→message 대조를 준비한다. 이 작업은 제품 main/Editor Run이 아니며 Run상한을 늘리지 않는다. 의미 불일치면 현재 Run을 종료하고 미검증으로 남긴다.

- 번역 resource-only 대조 완료: 두 파일 OptimizedTranslation locale ko/en 및 각32개 key(총64값)가 후보=재import=CSV 실제message로 일치, mismatchedKeys 없음/최종오류 없음. 초기 probe parse오류는 별도보존하며 UI통과나 TDD로 세지 않는다. 정확한 결과/로그를 translation-resource-probe에 보존했고 압축binary차이는 그대로 source지문에 포함한다. 같은 Run1에서 실제 CUA 입력을 시작하며 deadline은 그대로다.

### Run1 실제 타이머·힌트 미확인 중단 관찰

- 실제 공통 바나나를 상단에서 눌러도 진행 없음, 오답별→즉시하단바나나 count10잠금, 복구후같은바나나 count9 진행을 확인했다. 첫정답뒤타이머가 시작됐다.
- 유휴 힌트는 source start_hint의 하단공통심볼 **흔들림**이다. 초기계획의 ‘유휴O힌트’는 문서오류이며 O는 안내/정답피드백이다. 제품규칙수정없음.
- 8개실제F7burst와추가3개시간간격프레임을수집했으나 lowercookie xbounds62..109로 움직임을증명하지못했다. count9/HUD11s가capture340897ms와391074ms에서동일하여50초actualticks경과에도시간미진행을관찰했다. CUA뿐아니라actualviewportPNG도동일했다. 환경/제품원인단정없이입력멈춤,동일Run유지/추가Run없음. 구현자에게실제증거와미확인상태를즉시전달했다.

### Run1 종료·Run2 정상 재시작 시작 전 확인

- Run1 정상10정답 완료:513.123436333499초/clear1/9splits, 정상primary/.bak에 동일기록. 결과설정/TabReturn/Retry/No/Yes 확인. Retry 뒤12.011초 actualF7 176프레임에서 하단공통달팽이x범위[238,272]→[235,269]→[240,274]→[237,272], actualtimer25→27→28s/이후148s 진행. 힌트호출/값/시간주입 없음. 초기8무변화/11s고정은 원인미확정으로보존.
- actualYes 뒤game13138 부재22:34:59.172698Z, 자기Editor13107 종료. 종료직후AX 재조회가 자기QA앱을 인자없는ProjectManager66312로 자동시작해, UI입력/EditorPlay 없이 그자기PM만 종료했다. EditorRun 추가가 아닌 환경도구fallback으로보존한다. 이후Yes 뒤는AX를호출하지않고shell로자기PID부재만확인한다. 세PID부재확인.
- Run2 준비/시작요청 기록 **2026-10-11T22:35:56.439353+00:00**. 정상primary는Run1저장SHA와동일, 같은전용userdir 재사용/손상·seed없음. 창405×720/F7출력run-2만환경변경. deadline22:55:00.631136Z 그대로.

### Run2 종료·마지막 Run3 시작 전 확인

- Run2 실제10정답53.9175103333313초/clear2/9splits 정상신기록, 요청405 대비 실제Window/PNG406×720. 정상primary EN/ON, .bak EN/OFF에 같은best/clear2/9splits를 읽고 백업/해시 보존. 최초restart는513s/1clear/EN/OFF·안내반복없음을actual확인. 실제Yes 종료22:41:24.667611Z/game72236부재 및 자기Editor72087부재확인.
- Run3 실행전 2026-10-11T22:41:48.577342+00:00 정상primary/bak 스냅샷·경로·해시를 확인했다. 이번회차전용primary만불완전JSON으로손상, bakSHA미변경확인뒤540×720 같은guard 경로에서 마지막세번째Run을요청한다. 기대복구는bak의53.9175103333313초/clear2/9splits/EN/OFF. deadline22:55:00.631136Z 및3Run상한그대로.


### Run3 백업 복구·실제 종료 및 실행 상한

- 마지막 Run3의 Editor 로그 생성 **22:41:56.797487Z**, 실제 headless Editor83187→비headless·비embedded OpenGL GUI83382. 로그 생성 시각은 실행 명령의 출력 파일 생성 근거이며 정확한 GUI 가시 시작 시각으로 바꾸지 않는다. actual CUA 고유 게임 창을 선택했고 user:// guard는 Save 앞, self-contained config/cache·embed=-1·유한 rect/transform·Window540×720 확인.
- 손상 primary SHA `990b33c612d31f66f8a59831edee893ce7c03c990126bd9a12776f16ed9469e3`, 정상 .bak SHA `bed7783d61d7e1dadf26748772c6b99c7107896337d26f13e04c9a0d0b538245` 유지. actual title **BEST53s/2CLEARS**, 설정 **EN/OFF**는 정상 .bak의53.9175103333313초/clear2/9best_splits/en/mutedtrue와 일치했다. 손상 전 primary는 EN/ON이므로 기본값이나 primary 설정을 읽은 결과와 구별된다.
- 로드는 .bak을 읽었으며 primary를 즉시 수리하지 않았다(`run-3-recovery-observation.json`). 이 동작을 자동 파일 수리라고 주장하지 않는다. 같은 실제 게임에서 안내 반복 없이10정답→**63s/BEST53s** 정상완료(신기록 아님)·막대9개·clear3. 복구된 최고/9best_splits는 유지됐다. 완료 후 실제 소리ON 설정쓰기1회로 정상 primary/.bak을 읽고 보존했다. 최종 primary SHA `0ed516ffdc9d573b759cbd4b2f1cbbca2e0f1fc4c2e6612d8e18f30abdba2b88`, .bak SHA `2bc8aca62efe1c6ee40fabf0dab6663be53bd3052c8a6f3feb56b9fdedd62ade`; 둘 다 clear3/최고53.9175103333313초/동일9best_splits/en/has_playedtrue, primaryON·bakOFF. 손상 primary를 normal.bak으로 회전해 덮지 않은 후속 정상 쓰기 근거다.
- 넓은 결과의 Settings/Back/Exit/No는 결과를 보존했고 actual Yes 이후 GUI83382부재 **22:45:08.932343Z**. 자기 Editor83187 등 이번 회차 모든 자기 PID부재·GUI반환 **22:45:15.861957Z**. 첫 요청부터 **1815.230821초(30분15.23초)**, **3회 Run**, deadline **22:55:00.631136Z**보다 먼저 종료. 종료 이후 추가 실행 없이 증거와 보고서만 정리했다. `round-4-execution-ended.json`, `run-timing-provenance.json`에 정확한 시각의 의미를 구분했다.

### 전체 기능·UX 최종 판정

판정 범위는 **정상 제품 main의 실제 Godot Editor Run이 만든 desktop GUI에서 가능한 기능과 사용성**이다. 후보385fa2e의 tracked 행동 스크립트·CSV는 동일하고, Editor 자동 직렬화·압축 재import·격리 설정은 아래에 명시했다. 실제 macOS 입력·렌더를 썼으며 headless Editor host, 대역 notification, desktop 미지원 SDK를 iOS 실기기 근거로 확대하지 않는다.

| inventory 항목 | 실제 입력·관찰과 근거 | 기능/UX 판정·사용자 영향 | 수정 제안/한계 |
|---|---|---|---|
| title | Run1 최초 타이틀→clear1; Run2 정상primary 재시작 BEST513s/1CLEARS; Run3 손상primary/bak 재시작 BEST53s/2CLEARS. 세비율 START/SETTINGS 실제탭, PNG·저장 일치 | 기능·UX 통과(Editor). 제목/기록/동작 가독성·접근성 확인 | 이번 범위 제품 수정 없음 |
| first-run-tutorial | Run1 안내3단계 카드8심볼/정답O/손가락/마지막START. 마지막 배경탭은 무진행, START로만 진입. Run2/3 정상has_played 저장 재시작은 안내 반복 없음 | 기능·UX 통과(Editor). 단계와 마지막 행동 구분 | O는 안내/정답피드백이며 유휴힌트와 구분 |
| matching-game | Run1 상단 공통그림은 무진행, 하단 실제10정답 완주. Run2/3 실제 카드10정답 각각53s/63s 결과. Run1 Retry는10/0s로 새게임·안내없음 | 기능·UX 통과(Editor). 세비율 두카드·HUD·하단입력·결과버튼 잘림없음 | deck/time/save seed 없음 |
| wrong-answer-and-hint | Run1 오답X→즉시정답 입력은잠금count10→복구후count9. 초기8프레임/추가3프레임 미움직임은보존. Retry 뒤176 actualF7프레임/12.011초의 하단공통달팽이 `[238,272]→[235,269]→[240,274]→[237,272]` 좌우움직임 확인 | 기능·UX 통과(Editor 실제 재확인). 오답복구·힌트 흔들림을 실제 픽셀로 구분 | 이전 O힌트 표기 오류는 정정·이전PNG통과근거로 사용안함 |
| timing-and-splits | 첫정답 전0s→첫정답뒤측정. 세판10정답/실제막대9. Run1저장9splits합계513.1234363334984≈best513.123436333499, Run2 9합계53.91751033333131≈best53.9175103333313. 신기록513→53, Run3 63/BEST53 유지 | 기능·UX 통과(Editor 재확인). timer25→27→28s 자동진행·결과/최고/빠름느림색 구분. 아래11s고정 관찰은 원인미확정으로 남김 | 10정답 중첫정답이 측정시작이므로 9구간. 규칙변경 없음 |
| record-persistence | 실제파일 경로guard·세판 clear1→2→3. primary 그대로 실제재시작 기록/설정 유지. 확인·백업한 전용primary만손상 후 .bak 기록·설정 실제복구. 정상settings write 후 두파일 다시정상 | 기능·UX 통과(Editor 실디스크). 재방문기록·설정·안내여부·bak후속쓰기에 허위 초기화 없음 | MemoryStorage sandbox와 구별. native중단/디스크full 등 물리오류 미검증 |
| language-and-sound-settings | Run1 SYSTEM/ko/en 실제선택·문구즉시변경/ON/OFF·TabReturn 닫기, 결과설정도정상. Run2 EN/OFF primary보존, Run3 bak의EN/OFF복구. 세비율 설정패널 실제입력/PNG | 기능·UX 통과(Editor). 선택색/문구/키보드접근·닫기·뒤로·파일값 일치 | 실제 오디오 청취/물리mute 미검증; 설정동작·저장판정만 |
| back-and-exit | F6 CUA키→제품Back notification 처리, 설정닫기·종료popup·No원상태·modal 뒤settings 입력차단. 실제Exit/No/Yes·Retry. 세Run actualYes 종료 및 자기PID부재 | 기능·UX 통과(Editor 제품경로/팝업). 취소가 기록/게임을 바꾸지 않고 종료성공 | F6 notification proxy는 OS hardware/AITBack 아님. desktop Esc미연결을 결함으로 확대안함 |
| safe-area-and-awake | 실제Window/PNG **324×720,406×720,540×720**, title/settings/game/result와 좁은guide. runtime desktopinset0·유한rect/transform, 실제 입력위치와 시각화 일치 | 기능·UX 통과(Editor 지원 화면비·desktop 경로). 좁은/중간/넓은 화면 버튼·카드 접근 확인 | 요청405가Retina에서실측406(1px차이),405실측주장안함. 물리safearea/회전/awake/background/hardware미검증 |

비core4개도 실제 desktop에서 확인했다. `native-leaderboards`·`interstitial-and-privacy`·`ait-share`는 미지원 버튼이 숨었고 정상 Start/Retry/Exit/Settings를 방해하지 않았다. analytics는 desktop no-op 경로이며 provider 전송을 주장하지 않는다. 실제 UMP/광고노출/GC/AIT공유/analytics 서버·SDK 성공은 **미검증**. 개인정보 Opening·성공/실패·저장실패 UX 대역은 [2회차](iteration-2.md)의 제품동일 행동소스 근거로만 연결하며 이4회차 정상 main에서는 그버튼이없다. native SDK·hardwareBack·AIT·safearea·awake·물리오디오 검수와 최종 병합SHA E2E는 별도 gate다.

### 문제·정정·재확인 이력

- 첫 실행 번역 재import와 main UID직렬화로 전체byte일치가깨져 입력을멈췄다. raw/hash/diff를 보존하고 번역32CSV key×ko/en64값을 실제Resource로 대조해 의미동일을 확인한 뒤 **같은 Run1**에서 계속했다. `translation-resource-probe/result.json`; 초기helper parse오류도별도보존/UIpass로세지않음.
- 첫 판 HUD11s·F7텍스처가50초간고정된 실제관찰은 삭제하지 않았다. 제품시간이멈춘것으로 확정하지 않으며 **렌더/HUD 고정** 증거다. 다음actual정답에서369s로갱신→자동진행398s→정상513s완료, Retry 자동25/27/28 및이후148s/196s 등으로 재확인했다. 구현자가 macOS occlusion에 따른 draw 생략 가능성을 조사했으나 실제occlusion을읽지않아 원인미확정. F7pause·제품결함·원인해결로 단정하지 않는다.
- 초기Retry3프레임도달팽이xbounds가동일하므로 독립증거JSON의 잘못된 movement 문구를 originalInterpretationPreserved에남기고 unknown으로정정했다. 최종힌트통과는 **12.011초/176actualF7프레임**과좌/우원본69·70로만판정한다. 게임값/시간/힌트호출·설정 주입없음; 자기QA창Raise와기존F7 캡처만사용했다.
- Run1 actualYes 뒤 AX조회가 인자없는 자기QA ProjectManager를자동시작했다. 자기PM만인자/PID확인후종료했고 Play나제품입력없음. Run2/3 Yes 뒤AX/getApp을호출하지않아 재발없음. 도구fallback과EditorRun을 구분하며 총3Run그대로다.
- 실제완료시저장 경고/실패UI없고 세Editor/Game로그의 SCRIPT ERROR/ERROR/NaN을검사해0건. 이값은 이전회차실패나resourceprobe초기parse오류를지우지않는다.
- 이전 [1회차](iteration-1.md)의차단, [2회차](iteration-2.md)의viewport미확인, [3회차](iteration-3.md)의embedded초기0/바인딩차단 및정상재시작/backup/좁은비율미검증은보존한다. 이번 `record-persistence` Run2/3·세실측화면·고유GUI입력·actual힌트근거를 **resolutionEvidence**로연결할수있다. 예전실패판정을pass로바꾸거나E2E로우회하지않는다.

### 대표 캡처와 자료 위치

최종 공개근거 폴더는 `evidence/round-4`이며 원본231PNG·raw/public로그·저장스냅샷·후보/환경/metadata/번역지문은 회차 폴더 `mp-ios-116-ui-round-4-385fa2e`에 보존했다. 아래 대표는 원본 해상도검사 후 선택했다. 전환중간프레임(예:Run1의언어전환3·4, Run3게임진입3)은 안정레이아웃 근거로세지않는다.

| 실제파일(run-N/ 아래) | 장면·의미 |
|---|---|
| run-1/capture-133417-1.png | 324×720 최초KO타이틀·기록없음 |
| run-1/capture-139831-2.png | SYSTEM 선택·KO설정/소리켜짐 |
| run-1/capture-156626-5.png | 안정EN설정/소리OFF |
| run-1/capture-876566-28.png | 안정KO설정/선택색·소리ON |
| run-1/capture-172342-7.png,178658-8.png,183792-9.png | 안내3단계:8심볼→양쪽O→손가락/START |
| run-1/capture-201954-10.png,209191-11.png | 좁은정상game·오답X/count10 |
| run-1/capture-340897-16.png,391074-26.png | 실제ticks50초차이/HUD11s고정·원인미확정 |
| run-1/capture-874613-27.png,881541-29.png | 정상완료513s/NEWBEST·ko결과·9구간 |
| run-1/capture-1071754-37.png,1073200-69.png,1073378-70.png,1073650-72.png | actual유휴힌트 base/좌/우/복귀4대표,12초176프레임묶음 |
| run-1/capture-919720-32.png | narrowQuit Yes/No·뒤결과/modal |
| run-2/capture-18624-1.png,19501-2.png | 406×720 정상primary재시작 BEST513/1clear·EN/OFF유지 |
| run-2/capture-47168-3.png | mediumGame10/0s/BEST513·안내반복없음 |
| run-2/capture-253753-5.png,275711-7.png | medium정상53s/NEWBEST/9막대·설정ON실제쓰기 |
| run-3/capture-15118-1.png,20078-2.png | 540×720 손상primary/.bak 재시작 BEST53/2clear·bakEN/OFF복구 |
| run-3/capture-55548-4.png | 전환완료wideGame10/0s/BEST53 |
| run-3/capture-139058-5.png,157891-7.png | wide정상63s/BEST53/9막대·설정ON실제쓰기 |
| run-3/capture-171790-8.png,177174-9.png | wideNo결과보존·마지막Yes전종료popup |

- `source-provenance-final.json`: 후보archive820파일 중816byte일치, 정확히4변경. `project.godot`은 공식격리경로/창/autoload/plugin 환경수정; `main.tscn`은UID/unique_id/load_steps 메타만; en/ko.translation은RSRC→RSCC 압축재import,32키×2locale실제값동일. **전체프로젝트byte동일 주장없음**, tracked 행동gd/CSV는동일. 원본/직렬화본·exactdiff/hash 포함.
- `environment-run-1/2/3-manifest.json`, `project-environment-run-1/2/3.diff`, `environment-source-run-N/`: 각Run 실행전지문 및 검증된helper변형원본. app/원본binary/고유bundle/self-contained receipt, 자기editorpref 지문 포함. 격리자동SDK다운로드는 `generated-sdk-environment-assets.json`에환경파일/hash로분류하며 native실행근거아님.
- `capture-manifest.json`: Run1 214,Run2 8,Run3 9,총231PNG encoded치수/SHA. `run-1-retry-idle-hint-12sec-evidence.json`:176actualF7입력/12.011초/좌우bounds·원본해시.
- `run-1/2/3-save-snapshot.json`, `run-3-recovery-preparation.json`, `run-3-corruption-observation.json`, `run-3-recovery-observation.json`: clear1→2→3,손상전/후·bak미변경·actualUI와파일값. 정상 .bak에기록을 넣는 실제settingswrite를정상완료후수행했다.
- `runtime-log-inspection.json`, `run-timing-provenance.json`, `round-4-execution-ended.json`:로그/정확한시각의의미/상한·자기PID종료. raw로그와 공개경로를치환한public로그의각해시/변환은최종manifest에연결한다.

## 수정·재확인·남은 문제

제품코드 수정없음. 승인된UI4회차·총3Run·40분상한을완료했고 **Editor지원9core 기능/UX 통과**, 네이티브항목은미검증이다. HUD11s고정의원인미확정은 관찰보존·후속실제진행근거와 함께남긴다. 이번후보의최종UI자료는 source/env 지문과 actual입력/파일/PNG를 묶어해석해야하며 화면캡처만으로통과처리하지않았다. 종료후5회차/4번째Run/E2E/물리SDK/빌드/배포/제출은시작하지않았다.
