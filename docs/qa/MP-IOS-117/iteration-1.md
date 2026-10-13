# MP-IOS-117 UI 검수 1회차

## 실행 전 계획

- 설계 MP-IOS-117 v1, 승인 커밋 c92196fab6a302832c4919f71ff745cb3d280db6, AC-1~AC-3 개발 단계.
- 후보 87658f511215bb5227e876118e4f7e979ee5d859. 계획 시각 2026-10-13T11:55:08.394493+00:00. 구현자 /root, 독립 검수자 /root/privacy_ui_review. 페르소나: 처음 사용자·요구사항 검수자.
- 환경: Godot 4.7.2 실제 Editor Run의 별도 GUI child와 전용 CUA app. 전용 bundle com.seorilabs.matchpicture.mp117review. self-contained config/cache.
- 프로젝트 build/round-1/godot, main은 후보의 review_sandbox.tscn. 행동소스는 git archive 후보. QA guard/plugin만 추가. 저장명 match-picture-MP-IOS-117-round-1-87658f5는 아직 존재하지 않음을 실행 전 확인. sandbox는 메모리 저장(best24.6/clear3), 실제 파일 재시작으로 주장하지 않음.
- 최대 1회 Editor Run·25분. 환경 시작 실패는 그대로 보존하며 새 Run을 임의 추가하지 않음.
- F5 허용/F6 거부, F1 UMP 필요 toggle/F3 완료/F4 실패, F9 canRequestAds toggle/F10 활성복귀, F12 loader 완료·표시 종료, F7 PNG, F11 읽기 전용 상태·npa 관찰. Ctrl+B는 Back notification proxy이며 OS hardware 근거 아님.
- 순서: 초기 미결정 상태의 ATT요청1·SDK/loader0 확인 → 타이틀 설정/system/ko/en/sound·UMP 필요/Opening/실패/완료 → 안내3단계 → 상단 차단/오답잠금/힌트/실제 하단10정답 → 결과/9구간/기록 → 허용/F12준비/npa → Retry 기존 기회에만 show/F12닫힘 → UMP 차단/게임 진행·취소/종료.
- 핵심 전체 기능: title, first-run-tutorial, matching-game, wrong-answer-and-hint, timing-and-splits, record-persistence, language-and-sound-settings, back-and-exit, safe-area-and-awake. 비core: native-leaderboards, interstitial-and-privacy, ait-share, analytics.
- 기능·UX 기준: 실제 입력과 상태가 기대와 같고 작은창에서 문구/버튼/심볼 접근 가능. 초기 광고0과 허용뒤npa·Retry를 로그에 연결. 플랫폼 미지원 숨김/no-op과 실제 SDK 성공을 구분. 기능·UX·실제 SDK 판정을 분리.
- 증거: pre-run-manifest.json·exact environment diff·app receipt·Editor/game log·F7원본 PNG/치수/해시·실제 CUA입력·관찰. SCRIPT ERROR/ERROR 및 행동소스 차이면 중단/즉시 보고.
- 이어받은 기반기능 없음. iPad 실기기 환경 없음·미실행.

| 항목 | 기능 기대 | UX 기대 | 오류/복구·증거 |
|---|---|---|---|
| 개인정보·광고 | ATT미완료 SDK/load0; 허용후npa; UMP변경이광고폐기; Retry에서만표시 | 개인정보Opening/실패가게임진행막지않음 | F1/3/4/5/9/10/12·F11로그 |
| 9 core 전체 | 실제10정답·9구간·기록/설정·오답잠금·유휴좌우흔들림·Retry/취소/종료 | 안내와행동·기록/실패문구·카드/버튼·초점·324x720 실측 | 실제카드와설정입력·F7 PNG |
| 비core3 | desktop미지원숨김/no-op | 가능한게임버튼유지 | native/AIT/전송미검증 |

## 실행 후 관찰·판정

- 실행 요청 2026-10-13T11:55:29.945213Z, 종료/증거 수집 12:05:23.742134Z. Editor host85332→비headless·비embedded GUI90259, actual EditorInterface Run1회. 제품 Yes로GUI종료·자기Editor종료. CUA초기바인딩이만든자기ProjectManager87766은제품입력없이종료했다.
- 실제Window/PNG324×720, visible_rect648×1440. self-contained와user://guard는Save전검증. 기록된환경외tracked행동소스변경없음. 번역32key×ko/en64값Resource/CSV대조실패0.
- 대표/원본PNG75개와해시는build/round-1/capture-manifest.json. raw/private로그는같은격리폴더에,공개로그는round-1-*-public.txt에보존.

| 항목 | 실제관찰·근거 | 기능/UX문제·사용자영향 | 판정 |
|---|---|---|---|
| title·settings | BEST24s/clear3→4; ko/en/system·soundOFF/ON·TabReturn닫기; 시작/닫기·작은화면문구/버튼접근 | 확인범위결함없음 | Editor기능/UX통과 |
| first-run-tutorial | actual3단계/마지막배경무진행/Start로진입/Retry반복없음 | O는안내/정답표시이며힌트가아님 | Editor기능/UX통과 |
| matching-game | 상단UFO무진행·하단10정답실제탭·Retry새판10/0s | inactive창입력/표시정체관찰; Raise뒤진행,원인미확정 | 실제완료통과·정체관찰보존 |
| wrong-answer-and-hint | 오답avocadoX→즉시UFO잠금count10→복구count9. whale유휴57PNG의x137..184동일 | 좌우흔들림증거없음,코드나O로통과처리안함 | 오답/복구통과·유휴힌트미검증 |
| timing-and-splits | 첫정답뒤timer0→24→41…156s/9구간막대,기존BEST24 | 76s정체뒤Raise/112s진행을보존;제품원인단정안함 | 실제시간/결과통과·정체원인미확정 |
| record-persistence | in-memoryclear3→4/BEST24.6유지·settings값갱신·타이틀read-back | 파일재시작/backup아님 | 메모리범위통과·실디스크미검증 |
| back-and-exit | Ctrl+Bproxy→Quit/No원게임·타이틀Quit/Yesactual종료 | OS하드웨어Back미검증 | Editor제품경로/UX통과 |
| safe-area-and-awake | actual324×720/desktopinset0·title/settings/tutorial/game/result잘림없음 | physicalsafearea/awake아님 | 좁은Editor비율통과·native미검증 |
| interstitial-and-privacy | 초기ATT0/UMPtrue/requests1/init0/load0. Opening중복클릭·F4실패·F3복구동안init/load0. 완료뒤F5ATT3/init1/load1·F12readytrue/npa1·actualRetryshowingtrue. F12닫힘→load2, F9UMPfalse/F10에서load추가없음 | UMP양식·ATT·광고는SDK대역. 실패짧은문구/닫기/Retry진행정상 | 실제adapter대역기능/UX통과·native미검증 |
| native-leaderboards·ait-share·analytics | desktop미지원버튼숨김/no-op·게임방해없음 | 실제GC/AIT/전송아님 | desktop범위통과·native미검증 |

## 수정·재확인·남은문제

제품코드수정없음. source/path/각event로그와75PNG를함께읽는다. SCRIPT ERROR/ERROR0. archive에native.a가없어Editor가반복출력한Invalid plugin config ad_privacy.gdip경고는preserved,실기기번들검사를대체하지않음. 1회차유휴힌트미검증·실디스크재시작미검증은보존하고후속회차actual근거로만resolutionEvidence연결한다. 네이티브광고/권한·iPad는blocked/미실행이다.
