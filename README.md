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
| 최초 1회 그림 안내, 결과 · 종료 확인 | 파워업 · 콤보 · 탭 셸 UI |
| 타이틀 화면, 로컬 최고 기록과 구간 기록 | |
| 한국어/영어 | |

## 구조

```
godot/                    Godot 프로젝트 (project_dir)
  src/core/               게임 규칙. 노드도 파일도 SDK도 모르는 순수 코드
  src/core/ports/         저장·계측·광고·순위표·공유 포트 인터페이스
  src/platform/           포트 구현. 여기서만 SDK를 안다
  src/ui/                 화면. 코어가 알린 것을 그림과 소리로 옮기기만 한다
  autoload/               Platform → Save → Locale → Ui → Audio (의존 순서)
  tests/                  코어 · 엔진 스모크 · 통합 플레이 · 화면 캡처
  export_templates/       커스텀 Web 템플릿 (tools/build_web_template.sh 산출물)
  analytics.config.json   GA4 설정. 릴리스에서는 CI가 주입한다
ait/apps-in-toss-web/     앱인토스 래퍼. Godot Web export를 감싸 .ait를 만든다
scripts/                  Godot 실행과 export 게이트
tools/                    검사기와 빌드 도구
app-store/ play-store/    스토어 설정과 서명 옵션
ops/                      Play 데이터 안전 공시 원장
```

### project.godot 값이 그런 이유

AdMob 에디터 플러그인을 켜면서 `project.godot`은 엔진이 소유하게 됐습니다. Godot이
저장할 때마다 주석과 기본값 항목을 지우므로, 설명을 파일 안에 둘 수 없어 여기 옮깁니다.

| 값 | 이유 |
|---|---|
| `config/name` = "같은그림찾기" | 홈 화면 아이콘 라벨이라 짧게 둡니다. iOS는 이 값이 그대로 `CFBundleDisplayName`이 됩니다. Android 라벨은 export preset의 `package/name`이, 앱인토스 표시명은 `granite.config.ts`가 따로 가집니다 |
| `config/version` = "2.0.0" | 로컬 개발용 placeholder입니다. 릴리스 버전 정본은 GitHub 태그 하나뿐이고 중앙 워크플로가 덮어씁니다 |
| `config/quit_on_go_back` = false | 안드로이드 백키 기본값은 어디서 눌러도 앱을 끄는 것입니다. 꺼 두고 `src/ui/main.gd`가 원본 Unity 순서대로 화면을 한 단계씩 되돌립니다 |
| viewport 648x1440, stretch `expand` | 원본 Unity CanvasScaler(referenceResolution 2960x1440, Shrink)를 재현한 값입니다. 16:9~20:9에서 캔버스 높이가 1440으로 고정되고 폭만 648~810으로 변합니다. `keep_height`를 쓰면 21:9에서 폭이 617로 잘려 카드 가장자리가 사라집니다 |
| autoload 순서 | 의존 방향입니다. Platform(표면 판정) → Save(user:// 저장) → Locale(저장된 언어 적용) → Ui(로케일 확정 후 테마 조립) → Audio |
| 기본 폰트 미지정 | 부팅 시점 로드가 첫 import보다 앞서서 clean 체크아웃마다 ERROR를 남깁니다. `autoload/ui.gd`가 import 이후에 `ThemeDB.fallback_font`로 붙입니다 |

경계는 도구가 강제합니다. `godot/src/core/`가 `FileAccess`나 `OS.` 같은 것에 손을 대면
`tools/check_core_boundary.py`가 막습니다. 규칙이 순수해야 화면 없이 게임 한 판을
헤드리스로 완주시킬 수 있습니다.

플랫폼 기능은 포트 뒤에 있습니다. 앱인토스는 기존 게임센터 브리지를 그대로 쓰고,
Google Play는 Play Games Services, App Store는 GameKit을 씁니다. 화면은
`is_available()`만 보고 버튼을 그리므로, 콘솔 ID 또는 해당 네이티브 플러그인이 없으면
순위표 버튼·점수 제출 모두 꺼지고 포트 기본 no-op이 맡습니다.

네이티브 순위표 ID는 콘솔에서 생성 또는 재조회한 뒤에만 넣습니다. 현재 이 저장소의
값은 2026-09-22에 해당 콘솔에서 다시 확인한 공개 ID이며, ID를 추측하거나 다른 앱 값을
재사용하면 안 됩니다.

| 마켓 | 필요한 콘솔 입력 | 넣을 곳 |
|---|---|---|
| Google Play | `PLAY_GAMES_PROJECT_ID`, `PLAY_GAMES_LEADERBOARD_ID` | 각각 `godot/leaderboard.config.json`의 `play_games.project_id`, `play_games.leaderboard_id`; 같은 프로젝트 ID를 `godot/export_presets.cfg`의 `godot_play_game_services/game_id`에 넣고 `plugins/GodotPlayGameServices=true`로 켬 |
| App Store | `GAME_CENTER_LEADERBOARD_ID` | `godot/leaderboard.config.json`의 `game_center.leaderboard_id` |

Google Play 플러그인(GodotPlayGameServices v3.4.0)은 Android AAR 두 개를,
GameCenterKit v1.0.1은 iOS GameKit GDExtension을 각각 `godot/addons/`에 넣어 둡니다.
GameCenterKit의 iOS 전용 바이너리와 설명자는 `bin/.gdignore` 아래에 두어 Linux 에디터가
읽지 않게 하고, iOS export 훅이 원래 `res://addons/gamecenter/gamecenter.gdextension` 경로로
설명자를 넣고 XCFramework·초기화 심볼·GameKit.framework를 Xcode 프로젝트에 다시 넣습니다.
Web(.ait) 및 반대 네이티브 마켓 내보내기는 해당 바이너리를 제외하며,
`tools/check_leaderboard_bundle.py`가 버전·payload·확정 ID·내보내기 일치·플랫폼별 제외를 검사합니다.

전면광고는 표면마다 다른 SDK를 씁니다. 앱인토스는 토스 광고를, Google Play와
App Store는 원본 Unity와 같은 Google AdMob을 씁니다. 화면 코드는 `MpInterstitialAdPort`
하나만 보고, 어느 쪽이 꽂혔는지 모릅니다. AdMob 플러그인(Poing Studios v5.1.0)은
`godot/addons/admob/`에 바이너리까지 넣어 두었고, 광고를 요청하기 전에 UMP 동의를
먼저 받습니다.

계측은 Godot이 GA4 Measurement Protocol로 직접 보냅니다. 세 표면이 같은 코드로 같은
이벤트를 보내야 지표를 비교할 수 있기 때문이고, 그래서 래퍼에는 Firebase SDK가
없습니다. 이벤트 이름과 파라미터는 `godot/src/core/analytics_events.gd`가 계약으로
가지며, 계약을 통과하지 못한 것은 나가지 않습니다.

## 돌려 보기

```bash
godot --path godot     # 실제로 플레이
npm run check          # 게이트 전체 — 아래 검사를 한 번에 돈다
npm run capture        # 세 화면비로 렌더링해 godot/build/qa/ 에 PNG
```

`npm run check`가 도는 것: Godot 품질 게이트(import·compile·테스트 3종), 코어 경계,
효과음 재현성, AdMob·순위표 네이티브 번들 계약, Play 데이터 안전 공시 정합성, 배포
워크플로 계약.

앱인토스 번들을 만들고 브라우저에서 확인하려면:

```bash
GODOT_WEB_OUTPUT_DIR=build/web bash scripts/export_godot_web.sh
npm --prefix ait/apps-in-toss-web ci
npm --prefix ait/apps-in-toss-web run build      # .ait 생성 + 브랜드/키 검사
npm --prefix ait/apps-in-toss-web run build:web  # 미리보기용 웹 번들
npm --prefix ait/apps-in-toss-web exec vite preview -- --port 4173
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

### 커스텀 Web 템플릿

`godot/export_templates/web_release.zip`은 3D·물리3D·XR과 안 쓰는 이미지 포맷 모듈을
뺀 Godot Web 템플릿입니다. wasm이 37.7MB에서 27.3MB로, `.ait`가 18.2MB에서 14.7MB로
줄어듭니다. 다시 만들려면 `tools/build_web_template.sh`를 보세요.

Emscripten은 Godot 4.7.2 공식 Web 빌드와 같은 **4.0.11**로 맞춰야 합니다. 버전이
어긋나면 export는 되는데 브라우저에서 링크 오류로 멈춥니다.

**`javascript_eval=no`는 쓰지 마세요.** 그 플래그는 `JavaScriptBridge`의
`get_interface()`까지 함께 제거하는데, 그 함수가 앱인토스 래퍼와 주고받는 창구입니다.

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

App Store 배포 경로는 이 저장소가 public이라 GitHub-hosted macOS 러너로 돕니다.
Xcode Cloud 바인딩이 필요 없습니다. 다만 org secret은 visibility가 private이라 public
저장소에서 해석되지 않으므로, Apple 자격증명은 저장소 또는 `app-store` environment
스코프에 등록돼 있어야 합니다.

Android와 iOS의 스토어 식별자가 서로 다릅니다. 의도된 것이고 바꾸면 기존 등록을
잃습니다.

## 라이선스

소스는 MIT입니다. 심볼과 폰트는 각자의 라이선스를 따르고, 브랜딩과 스토어 자산은
MIT 범위 밖입니다. `NOTICE`를 보세요.
