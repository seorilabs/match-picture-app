# 같은그림찾기

위아래 카드에 함께 들어 있는 심볼 하나를 찾는 도블(Dobble) 방식 타임어택입니다.
10번 맞히는 데 걸린 시간이 기록이고, 짧을수록 좋습니다.

Godot 4.7로 만들고 앱인토스 · Google Play · App Store 세 곳에 냅니다.

## 무엇이 들어 있나

2020년 Unity 원본의 핵심 게임성만 남긴 재구현입니다. 한 번 웹(React + WebView)으로
포팅했다가 메타게임이 27가지 쌓였고, 원래 기획 정본인 "단일 모드 / 난이도 없음 /
심볼 1종 / 평가 지표는 클리어 시간 하나"로 되돌렸습니다. 웹 구현은 git 히스토리에
남아 있습니다.

| 있는 것 | 없는 것 |
|---|---|
| 도블 코어(57심볼 사영평면, 카드당 8심볼, 10라운드) | 스테이지 · 난이도 · 게임 모드 |
| 10초 뒤 정답이 흔들리는 자동 힌트 | 정원 · 코인 · 상점 · 심볼팩 |
| 오답 1.5초 입력 잠금 | 미션 · 출석 · 도감 · 통계 |
| 최초 1회 설명, 결과 · 종료 확인 | 파워업 · 콤보 · 탭 셸 UI |
| 로컬 최고 기록, 한국어/영어 | |

## 구조

```
godot/            Godot 프로젝트 (project_dir)
  src/core/       게임 규칙. 노드도 파일도 SDK도 모르는 순수 코드
  src/core/ports/ 저장·계측·광고·리더보드·공유 포트 인터페이스
  src/platform/   포트 구현. 여기서만 SDK를 안다
  src/ui/         화면. 코어가 알린 것을 그림과 소리로 옮기기만 한다
  autoload/       Platform → Save → Locale → Ui → Audio (의존 순서)
  tests/          코어 · 엔진 스모크 · 통합 플레이 · 화면 캡처
scripts/          Godot 실행과 export 게이트
tools/            경계 · 공시 · 효과음 검사기
```

경계는 도구가 강제합니다. `godot/src/core/`가 `FileAccess`나 `OS.` 같은 것에 손을 대면
`tools/check_core_boundary.py`가 막습니다. 규칙이 순수해야 화면 없이 게임 한 판을
헤드리스로 완주시킬 수 있습니다.

## 돌려 보기

```bash
godot --path godot                  # 실제로 플레이
npm run check                       # 품질 게이트 + 코어 경계 + 효과음 재현성
npm run capture                     # 세 화면비로 렌더링해 godot/build/qa/ 에 PNG
```

캡처에 강제 여백을 줘서 노치·제스처 바에 잘리는지 볼 수 있습니다.

```bash
godot --path godot res://tests/capture_screens.tscn -- --safe-area=0,140,0,90
```

### 검증 계층

| 무엇 | 어디 | 봐야 하는 것 |
|---|---|---|
| 규칙 | `godot/tests/core_test_runner.tscn` | 덱·라운드·배치·상태기계·기록 판정 |
| 엔진 | `godot/tests/test_runner.tscn` | autoload, 폰트, 번역, 세이브 원자성 |
| 조립 | `godot/tests/play_through.tscn` | 한 판을 실제로 눌러 끝내기, 뒤로가기 |
| 그림 | `godot/tests/capture_screens.tscn` | 잘림, 한글 깨짐, 카드 구분 |

**헤드리스 Godot은 `SCRIPT ERROR`를 찍고도 exit 0으로 끝납니다.** 종료 코드만 보고
성공이라 판단하지 마세요. `scripts/godot_quality_gate.sh`가 로그를 다시 검사하고,
파스 에러로 프로세스가 남는 것을 막기 위해 명령마다 시간 상한을 겁니다.

## 릴리스

**버전 정본은 GitHub 릴리스 태그 `vX.Y.Z` 하나뿐입니다.** 저장소는 버전을 계산하지
않습니다. 중앙 워크플로가 태그에서 Android `versionCode`/`versionName`과 Apple
marketing/build version을 파생해 주입하고, export 결과를 되읽어 대조합니다.
`godot/project.godot`와 `export_presets.cfg`의 버전 값은 로컬 개발용 placeholder입니다.

`v27.1`, `v27.1.NaN`, `v25.1` 같은 과거 2자리 태그는 릴리스 후보로 쓰지 않습니다.

main push/PR은 정적 게이트만 돕니다. 마켓 배포는 명시적 dispatch 또는 Release/Tag로만
나갑니다(Actions 분량 보호).

### 마켓

| 마켓 | 식별자 | 상태 |
|---|---|---|
| 앱인토스 | `match-picture-app` | 주 배포 경로 |
| Google Play | `com.github.magicsih.MatchPictureUnity` | 구 Unity 앱 승계 |
| App Store | `com.github.magicsih.MatchSymbol` (앱 ID 1528539634) | 2020년 Unity 빌드 1.0.4가 공개 중 |

Android와 iOS의 스토어 식별자가 서로 다릅니다. 의도된 것이고 바꾸면 기존 등록을
잃습니다.

## 라이선스

소스는 MIT입니다. 심볼과 폰트는 각자의 라이선스를 따르고, 브랜딩과 스토어 자산은
MIT 범위 밖입니다. `NOTICE`를 보세요.
