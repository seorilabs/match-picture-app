# MP-IOS-117 UI 검수 3회차

## 실행 전 계획

- 승인 설계 MP-IOS-117 v1, 승인 커밋 c92196fab6a302832c4919f71ff745cb3d280db6. 후보 `1fc334b170fd87c4e10d484112057846f59f22be`, AC-1~AC-3 개발 단계. 계획 작성 2026-10-13T12:20:57.346594+00:00. 구현자 /root, 독립 검수자 /root/privacy_ui_review. 페르소나: 반복 사용자·재시작/회귀·복구.
- 새 후보는 네이티브 요청 미접수·ATT 표시 타임아웃·OS 미결정 완료 뒤 다음 명시적 준비/활성화에서 재요청한다. 1·2회차의 원래 SHA·판정은 보존한다.
- 최대 **4회 Editor Run·40분**. Run1=실제 adapter+SDK 대역의 대기복구/철회·게임. Run2=normal main 새 파일 저장·405×720. Run3=정상 primary 그대로 재실행·540×720. Run4=확인·백업한 회차 전용 primary만 손상 후 backup 복구·540×720. 각각 별개 시나리오이며 새 회차/무제한 재시도는 하지 않는다. root가 4Run 범위를 확인했다.
- 전용 app/self-contained·포트31773/31775. build/round-3/godot의 후보 archive. Run1 전용 userdir match-picture-MP-IOS-117-round-3-sdk-1fc334b(메모리 저장), Run2~4 전용 userdir match-picture-MP-IOS-117-round-3-disk-1fc334b(실제 파일 저장). 실제 user:// guard는 Save보다 먼저 확인. 사용자 저장을 읽거나 초기화하지 않는다.
- Run1 main은 후보 review_sandbox를 상속한 QA scene. 실제 adapter/게임/GUI 입력은 후보 그대로이며 UMP/ATT/loader와 request_accepted만 대역. Ctrl+R 다음 준비, Ctrl+T timeout -1 신호/OS0, Ctrl+U 완료0 신호/OS0, Ctrl+P prepare, Ctrl+W 콜백 없는 권한 철회, Ctrl+L 최초 세대의 늦은 광고 완료. F5/F6/F9/F10/F12는 후보 키, Ctrl+B는 Back notification proxy, F7 PNG/F11 읽기.
- Run2~4는 **normal main**이다. QA addon은 실제 userdir/Editor 환경 확인, 원본 viewport 캡처·상태 읽기·Back notification proxy만 제공한다. 게임 값·deck·시간·저장을 주입하지 않는다. SDK가 없는 desktop 버튼 숨김/no-op과 실제 native 성공을 구분한다.
- 순서: Run1 초기 request false→명시적 준비→타임아웃/완료0 즉시 반복 없음→다음 활성/준비 재요청→허용 후 npa load/철회/오래된 callback 폐기·게임 진행/완료/Retry. Run2 ko/en/system/sound·안내3단계·상단차단/오답잠금/회복·실제10정답·유휴흔들림·9구간·파일 저장·결과 설정쓰기→No/Yes. Run3 같은 primary/최고/완료수/언어/소리/안내 비반복→넓은 게임/설정→Yes. Run4 primary 손상·bak hash 보존→actual 제목/설정/파일 backup 읽기·후속 정상쓰기/게임 접근→Yes.
- 전체13기능을 기능·UX 모두 확인하고 각 Run의 계획/환경 diff/해시/PID/시각/저장 스냅샷을 실행 전에 기록한다. 1·2회차와 연결하되 원래 실패·미검증을 지우지 않는다. 기반 기능 승계 없음.
- 증거·기준: actual CUA 입력/관찰, Editor Run GUI child, self-contained/userdir, file/PNG/log SHA, source 일치, 시작/종료. 화면 실측·문구/버튼/심볼·설정/저장 일치·자연스러운 Retry/취소·오류복구가 기대와 맞아야 함. SCRIPT ERROR/ERROR·행동 source 차이는 중단/보고.
- iPhone/iPad 실제 ATT·UMP·광고·네트워크, physical safe area/awake/오디오/VoiceOver는 이 Editor 회차로 증명하지 않는다. affected native 개인정보/광고는 blocked, iPad 환경 없음·미실행. 최종 E2E와 별도다.

## 실행 후 관찰·판정

승인된 3회차를 제한된 4개 Editor Run으로 완료했다. 확인한 Editor 범위는 통과했으며, 실제 네이티브 광고·권한과 최종 소스의 E2E는 **blocked**다.

| 실행 | 실제 환경·시각(UTC) | 수행과 결과 |
|---|---|---|
| Run 1 | Editor 92755 → GUI 92995, 12:21:31 시작, 405×720 | 실제 광고 어댑터와 SDK 대역, 요청 복구·철회·10정답·Retry·종료 |
| Run 2 | Editor 17741 → GUI 17864, 12:29:25 시작, 405×720 | 정상 main 신규 파일 저장, 설정·안내·오답·힌트·실제 10정답·144초 결과 |
| Run 3 | Editor 35673 → GUI 36599, 12:35:21 시작, 540×720 | primary를 그대로 재실행, 기록·설정 복원·안내 비반복·정답 입력·종료 |
| Run 4 | Editor 40825 → GUI 42139, 12:37:34 시작, 540×720 | 회차 전용 primary 손상 뒤 backup 복구, 정상 쓰기·게임 입력·종료 |

최종 종료·근거 수집 시각은 `2026-10-13T12:39:37.483491Z`다. 40분 제한보다 이르게 종료했고 추가 Run은 하지 않았다. 모든 GUI는 제품 Yes 입력으로 종료했으며 이후 자기 Editor host만 종료했다. 실행 로그에서 self-contained, Save 이전 user:// guard, 실제 EditorInterface Run 호출을 확인했다. Host는 headless Editor이며 child는 비headless·비embedded macOS/OpenGL 창이다.

### ATT 대기 복구와 광고 대역

초기 네이티브 요청 미접수(false)에서 ATT 요청 1회, SDK 초기화·로드 0회다. 다음 명시적 prepare는 요청을 2회로 늘렸다. 타임아웃 -1 신호와 OS 미결정 0을 함께 주었을 때 콜백 자체는 다시 요청하지 않았다. 다음 활성 복귀에서만 3회가 됐다. 완료 신호 0/OS 0도 즉시 반복하지 않았고 다음 prepare에서만 4회가 됐다. 여기까지 SDK 초기화·로드는 모두 0회다.

허용 뒤 초기화 1회·로드 1회가 됐다. 콜백 없이 OS 권한을 거부로 바꾸고 이전 세대의 늦은 광고 로드 완료를 전달하자 해당 광고는 `destroyed=true`, 표시 횟수 0이었다. 다시 허용하면 로드 2회이며 모든 관찰된 request extras는 `npa=1`이다. 실제 10정답 뒤 Retry에서 `showing=true`, F12 닫힘 뒤 `showing=false`·로드 3회를 확인했다. 이후 거부 상태에서도 새 판 10장/0초와 종료 경로가 유지됐다. 이 단계의 시스템창·UMP·광고·네트워크는 전부 SDK 대역이며 실제 iOS 증거가 아니다.

### 정상 파일 저장과 복구

정상 main 신규 실행에서 system/ko/en, 소리 OFF/ON, 3단계 안내와 마지막 Start 버튼을 실제 입력했다. 마지막 안내의 배경 클릭은 진행하지 않았다. 상단 입력은 카드 수를 줄이지 않았다. 하단 오답 X 직후 공통 복어 정답도 잠겨 카드 수 10을 유지했고, 잠금이 풀린 뒤 실제 정답은 9로 진행됐다.

실제 10정답을 입력한 결과는 `144.973129851875`초, 9개 구간, NEW BEST, 클리어 1회다. 정상 저장 파일과 실제 화면·Save.snapshot의 최고 기록/구간/완료수/has_played가 일치한다. 결과에서 소리를 켜는 실제 설정 쓰기로 기록을 포함한 backup 세대도 만들었다. 종료 취소는 같은 결과를 유지했고 Tab/Return으로 설정을 닫는 경로와 Yes 종료가 동작했다.

Run 3 시작 전 primary SHA-256은 `c93d623d000e402ddabcaaa0271d0b9e0a3ef08e329626a91e64a11845b08253`이다. 파일을 바꾸지 않고 재실행하여 영어 타이틀의 BEST 144s·1 CLEARS와 설정의 English/ON을 확인했다. Start는 안내 없이 게임으로 진입했고 넓은 화면의 실제 공통 그림 입력이 카드 수 10→9로 진행됐다. 후속 설정 입력을 통해 마지막 primary는 한국어/소리 켬, backup은 한국어/소리 끔이 됐다. 두 값은 로그·파일 스냅샷에 그대로 남겼다.

Run 4 전에 전용 저장의 두 파일을 복사 보존한 뒤 **자기 회차 primary만** 잘못된 JSON으로 바꿨다. backup SHA-256 `0689766c28a287b2322784122ee29eb026629f16578a73bd0f141056a37d5778`은 변경되지 않았다. 실행 직후 최고 기록·9구간·완료수와 한국어/소리 끔이 backup과 일치했고, 원래 primary는 아직 손상 상태였다. 즉 읽기 복구는 메모리에 이루어지며 정본 파일은 다음 정상 쓰기 때 복원된다. 실제 소리 버튼 쓰기 후 primary는 정상 JSON/소리 켬으로 복원됐고 backup 해시는 그대로였다. 안내 없이 게임에 진입하여 실제 정답도 입력했다.

### 유휴 힌트와 전체 기능

Run 2에서 원본 viewport 60프레임/34.301초를 수집했다. 하단 공통 아보카도의 초록 픽셀 x범위가 기준 141..183 → 137..179 → 141..183으로 이동·복귀한다. 세 원본을 직접 열어 확인했다. 시간·덱·힌트 값을 주입하지 않았다. [기준](evidence/round-3-hint-baseline.png), [이동](evidence/round-3-hint-left.png), [복귀](evidence/round-3-hint-return.png)는 원본을 그대로 복사한 것이다.

| 기능 ID | 기능·UX 결과 | 한계 |
|---|---|---|
| title | Editor 통과: 첫 실행·기록/완료수·재실행 타이틀 | 실제 iPhone/iPad 화면은 미검수 |
| first-run-tutorial | Editor 통과: 3단계·명시적 Start·재실행 비반복 | native 첫 실행은 미검수 |
| matching-game | Editor 통과: 상단 차단·실제 10정답·넓은 화면 입력 | 실제 터치는 미검수 |
| wrong-answer-and-hint | Editor 통과: 오답/잠금/회복·실제 유휴 흔들림 | native 입력/성능은 미검수 |
| timing-and-splits | Editor 통과: 첫 정답 뒤 시간·144초 결과·9구간 | 실제 background/복귀는 미검수 |
| record-persistence | 정상 main Editor 통과: 파일 저장·primary 재시작·backup 복구·후속 쓰기 | 기존 사용자/실제 iOS 파일은 읽거나 수정하지 않음 |
| language-and-sound-settings | Editor 통과: system/ko/en·소리 상태·파일 복원·닫힘/가독성 | 실제 오디오·OS 큰 글자·VoiceOver는 미검수 |
| back-and-exit | Editor 제품 경로/UX 통과: 취소 유지·Yes 종료 | Ctrl+B는 notification proxy, 물리 Back 아님 |
| safe-area-and-awake | 405×720·540×720 Editor 가독성/버튼·카드 접근 통과 | physical safe area/awake는 미검수 |
| native-leaderboards | desktop 미지원 숨김과 게임 유지 확인 | 실제 Game Center는 미검수 |
| interstitial-and-privacy | 실제 어댑터+SDK 대역 기능/UX 통과 | 영향받은 native ATT/UMP/광고는 blocked |
| ait-share | desktop 미지원 숨김과 게임 유지 확인 | 실제 AIT 공유는 미검수 |
| analytics | desktop no-op과 게임 진행 유지 확인 | 실제 제공자 전송은 미검수 |

### 근거·결함·남은 gate

candidate의 827개 Godot 파일을 원본 git archive와 비교했다. QA 환경용 project.godot 외 차이는 없으며 모든 제품 GDScript/scene 바이트는 후보와 같다. Run 2~4의 시작 전 manifest 파일은 실행 후 변경 0개다. Run 1의 project.godot은 Run 2 준비에서 계획대로 main/userdir만 변경했으므로 종료 뒤 전체 파일 무변경을 소급 주장하지 않는다. 실행 전 계획 원문·환경 diff·회차 helper·원본 로그/PNG·저장 스냅샷은 개인 근거 묶음에 보존한다.

회차의 새 원본 캡처는 Run별 4/71/6/6개다. 즉시 F7을 누른 완료 전환 프레임도 원문에 남아 있으나, 안정 결과 증거는 [144초 결과](evidence/round-3-result.png)를 사용한다. 네 game 로그의 SCRIPT ERROR/ERROR는 0이다. git archive에 ignored native .a가 없어 발생한 ad_privacy.gdip 경고는 지우지 않았고 실제 번들 성공 근거로 사용하지 않았다. 확인한 범위의 새 제품 결함은 없다.

1회차 유휴 힌트 미검증은 초기 판정을 보존하고 2·3회차 원본 근거로 연결했다. 1·2회차의 실제 파일 재시작 미검증은 이번 정상 main 세 실행으로 해결 근거를 연결한다. 기존 사용자 저장·기기 저장·전역 설정·원래 Godot 앱은 수정하지 않았다.

3회차 후보는 `1fc334b`다. 회차 진행 중 구현자가 추가한 “권한이 계속 허용된 복귀에서는 실패 광고를 다시 로드하지 않음”과 native 빌드/manifest 스크립트 수정은 **이 회차에서 미재확인**이다. 이 대역 통과를 최종 소스 증거로 소급하지 않는다. 실제 iPhone·iPad ATT/UMP/광고와 physical safe area/awake 등은 미실행이며 iPad 환경도 없다. 최종 E2E·native 기반 기능 gate는 blocked다. 추가 4회차는 시작하지 않았다.
