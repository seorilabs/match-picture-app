# MP-IOS-117 UI 검수2회차

## 실행전계획

- 승인설계MP-IOS-117v1/c92196fab6a302832c4919f71ff745cb3d280db6, AC-1~AC-3개발단계. 후보5c9d3b37d03509429078321fc53fe295564262d4. 계획2026-10-13T12:08:04.234528+00:00.
- 구현자/root·독립검수자/root/privacy_ui_review,사용자관점·오류/취소/작은화면.
- 전용app/self-contained/포트31773·31775. project build/round-2/godot·회차전용userdir match-picture-MP-IOS-117-round-2-5c9d3b3. 실제user://를Save앞에서확인. 후보review_sandbox를actualEditor Run·GUI/CUA실제입력. 메모리기록best24.6/clear3,파일재시작/backup증거아님.
- 최대1Editor Run/20분. 계획과manifest를실행전에기록했다. 반영파일은격리project.godot/QAhelper뿐이며제품행동소스동일.
- F6거부/F9UMP/F10활성복귀/F1필요/F3완료/F4실패/F2저장실패/F7PNG/F11읽기. QAguardCtrl+1제한/Ctrl+2native연결없음/Ctrl+3조회실패/Ctrl+4거부복원은SDK대역값만변경. Ctrl+B는Backnotificationproxy.
- 순서: 초기미결정→F6거부·init/load0→제한/연결없음/조회실패/복구·중복활성확인→ko/en/system/sound/프라이버시Opening/실패/완료→F2저장실패→실제안내3단계·상단차단/오답잠금/회복·하단정답10회·idle흔들림原本프레임→9구간/저장실패문구/기존기록→광고없는Retry·modal뒤입력차단·No/Yes.
- 전체13기능목록은review-plan표와같다. 각항목기능/UX기대: 실제입력/결과·문구/초점·작은화면가독성·설정/기록유지. 영향없는기반기능승계없음.
- 증거:pre-run-manifest/환경diff/appreceipt/실제Editor와game로그/CUA입력/F7PNG실측·해시/SDK대역계수. idle최소10초+흔들림0.5초주기를포함하는연속12초이상원본프레임관찰을계획하며창Raise를프레임입력마다수행해다른앱가림을피한다.
- 실제SDK/OS ATT/UMP·네트워크/물리safearea/awake/오디오/VoiceOver는미검증·iPad없음blocked. SCRIPT ERROR/ERROR·제품행동소스차이면중단/보고.

## 실행후관찰·판정

- 시작2026-10-13T12:08:30.843658Z, 종료2026-10-13T12:16:43.484792+00:00. 실제EditorHost47752→GUI47929,1Run,actualYes로종료·자기Editor종료. Window/PNG324×720·self-contained/userguardSave앞확인. 행동source변경없음.
- 초기ATT0/requests1/init0/load0→F6ATT2→제한1/availablefalse/오류-1/거부2·각활성복귀에서init/load0. helper관찰의UMP는allows_ads대역필드이며availablefalse때actualcan_request_ads는false다. 값과guard원문을함께읽는다.
- 10정답실제190.255551초완료/9구간/Record not saved·BEST24/clear3유지. F2는안내닫힘has_played정상저장직전잠시해제하고게임시작직후다시켜완료저장실패만격리했다. 이후F2해제/설정쓰기·ko/en/소리·Tab2Return닫기·Retry10/0s/안내반복없음/SDK0load0.
- 유휴힌트:100actualF7원본/29.186초,하단공통전갈주황픽셀x범위baseline235..287→left231..283→right237..289→복귀. actual원본left167658/right157249, timer31→41→43s. 힌트·시간·deck주입없음;창Raise와actualF7입력만사용. 1회차힌트미검증의resolutionEvidence로연결한다.
- 오답avocadoX→즉시scorpion잠금count10→복구count9,상단common탭은무진행. 안내3단계/시작·10정답·9막대·저장실패안내·좁은화면·종료No원결과·뒤Settings입력차단·Retry·Yes를actual입력으로확인. 실제결함없음.
- 실제원본PNG109개/해시는build/round-2/capture-manifest.json. raw/private로그는같은폴더,공개로그round-2-*-public.txt. SCRIPT ERROR/ERROR0,missingnative.a gdip경고는보존.

| 기능 | 기능·UX판정 | 근거와한계 |
|---|---|---|
| title·first-run-tutorial·matching-game | Editor통과 | 실제안내/상단차단/10정답/Retry |
| wrong-answer-and-hint·timing-and-splits | Editor통과 | 오답잠금/회복·실제전갈좌우흔들림100프레임·190s/9구간 |
| record-persistence | 메모리저장실패/이전값보존통과·실디스크미검증 | clear3/BEST24.6유지·Record not saved/진행유지 |
| language-and-sound-settings·back-and-exit | Editor통과 | ko/en·sound·키보드닫기·modal뒤입력차단·No/Yes;physicalBack/오디오별도 |
| safe-area-and-awake | 좁은Editor화면통과·native미검증 |324×720문구/카드/버튼접근;physicalinset/awake별도 |
| interstitial-and-privacy | 실제adapter SDK대역통과·native blocked | 거부/제한/연결없음/조회실패/UMPfalse·init/load0·게임완료/Retry |
| native-leaderboards·ait-share·analytics | desktop미지원숨김/no-op통과·native미검증 | GC/AIT/provider전송성공claim없음 |

## 수정·재확인·남은문제

제품source수정없음. 1회차미검증힌트는초기판정을보존한채이번원본프레임으로해결근거연결. 디스크정상재시작·backup복구는3회차,ATT미결정완료/타임아웃재요청수정은새3회차후보에서확인한다. iPhone/iPad실제광고/권한은blocked/미실행이며Editor대역결과로대체하지않는다.
