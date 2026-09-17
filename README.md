# match-picture-app

Unity 원본 같은그림찾기 게임을 Apps in Toss WebView/Granite 기반 미니앱으로 포팅한 프로젝트입니다.

## 개발 시작하기

```bash
npm install
npm run dev
```

`npm run dev`는 Granite 개발 서버를 실행합니다. 일반 브라우저에서도 게임 자체는 동작하며, Apps in Toss 브릿지(Storage, leaderboard, requestReview 등)는 토스 앱 또는 샌드박스 앱에 연결했을 때만 정상 동작합니다.

Android 샌드박스 앱에서 로컬 서버에 연결할 때는 기기에서 `localhost`가 Mac이 아니라 Android 기기를 가리키므로 포트 reverse가 필요합니다.

```bash
adb reverse tcp:8081 tcp:8081
adb reverse tcp:5173 tcp:5173
```

## 명령어

| 명령어 | 설명 |
| --- | --- |
| `npm run dev` | Granite 개발 서버 실행 |
| `npm test` | Vitest로 게임 핵심 로직 (Deck 알고리즘 / 게임 룰) 검증 |
| `npm run lint` | ESLint 검사 |
| `npm run format` | Prettier 일괄 적용 |
| `npm run build` | Apps in Toss CLI(`ait build`)로 배포 번들 생성 |
| `npm run deploy` | 배포 번들 업로드 |
| `npm run test:release-version` | stable SemVer → Play/App Store 빌드 번호 변환 검증 |

## GitHub Actions

CI/CD는 Seorilabs org 재사용 워크플로우(`seorilabs/.github/.github/workflows/*.yml@main`)를 호출하는 얇은 caller들로 구성됩니다. `uses` ref는 중앙 정본 `main` 하나로 고정합니다. SHA로 핀하면 중앙에서 계약을 고쳐도 저장소마다 ref를 갱신해야 반영되므로 정본이 갈라집니다.

| Caller | 트리거 | 호출하는 org 워크플로우 | 역할 |
| --- | --- | --- | --- |
| `static-checks.yml` | `push`/`pull_request`(main), dispatch | `rn-static-checks.yml` | `npm ci` → `npm run lint` + `npm test` 정적 게이트 |
| `deploy-apps-in-toss.yml` | dispatch, `workflow_call` | `rn-deploy-ait.yml` | 루트에서 `.ait` 빌드 → AppsInToss 배포 |
| `deploy-google-play.yml` | dispatch, `workflow_call` | `rn-deploy-google-play.yml` | Capacitor Android 동기화 → 서명 AAB → Google Play |
| `promote-google-play.yml` | dispatch, `workflow_call` | `promote-google-play.yml` | 내부 트랙 빌드를 재빌드 없이 production으로 승격 |
| `deploy-app-store.yml` | dispatch | — (비활성 human gate) | Apple archive는 Xcode Cloud 전용. GitHub Actions macOS 러너로 우회하지 않습니다 |
| `deploy-all.yml` | dispatch | repo caller 2종 | 동일 stable SemVer 태그를 AIT와 Google Play에 배포 |
| `release-tag.yml` | dispatch | `release-tag.yml` | 명시적 SemVer 릴리즈 태그 생성 |
| `cleanup-actions-storage.yml` | dispatch | `cleanup-actions-storage.yml` | Actions 아티팩트/캐시 정리 |
| `init-release-version-ledger.yml` | dispatch | `init-release-version-ledger.yml` | 릴리스 번호 원장 초기화. 저장소당 한 번만 실행하며, Android `versionCode`를 순차 할당할 기준 번호를 정합니다 |

main push/PR은 정적 체크만 돌고, 마켓 배포는 명시적 dispatch로만 실행됩니다. Web/AIT와 태그 해석은 ARC 러너(`seorilabs-rpi-arm64`), Android release는 x64 Linux로 분리됩니다. Apple archive·upload는 GitHub Actions macOS 러너를 쓰지 않고 Xcode Cloud가 표준 실행 환경입니다. `deploy-app-store.yml`은 `workflow_call`이 없는 비활성 human gate이고, 수동 dispatch하면 빌드 없이 안내 후 실패합니다. 파일 자체는 Backoffice의 마켓 타깃 감지(`appstore`) 때문에 남겨 둡니다.

릴리즈 버전은 workflow run 번호가 아니라 `vMAJOR.MINOR.PATCH` 태그가 기준입니다. 저장소는 버전을 계산하지 않습니다. org 정본 `main`의 재사용 워크플로우가 같은 태그에서 Android `versionName`/`versionCode`와 Apple marketing/build version을 파생해 빌드에 주입하고, build 뒤 artifact에서 다시 읽어 대조합니다. `v27.1` 같은 과거 2자리 태그와 `v27.1.NaN`은 릴리즈 후보로 사용하지 않습니다. 현재 마켓 기준은 Google Play `1.0.11`, App Store `1.0.4`이므로 다음 통합 patch 릴리즈는 `v1.0.12`입니다.

Apps in Toss 배포를 위해 GitHub repository 또는 environment `apps-in-toss`에 아래 값을 설정해야 합니다. caller 워크플로우는 `secrets: inherit`를 쓰지 않으므로, 새 secret이 필요해지면 org 재사용 워크플로우의 `workflow_call.secrets` 선언과 caller의 `secrets:` 매핑 양쪽에 이름을 추가해야 전달됩니다.

| 이름 | 위치 | 설명 |
| --- | --- | --- |
| `APPS_IN_TOSS_API_KEY` | Secret | `ait deploy --api-key`에 사용할 Apps in Toss API key. caller는 secret을 상속하지 않고, org 재사용 워크플로우가 선언한 이름만 `secrets:` 블록에서 1:1로 명시 전달합니다 |
| `AIT_APP_DISPLAY_NAME` | Variable | Apps in Toss 콘솔 앱 정보에 제출한 앱 이름. `granite.config.ts`의 `brand.displayName`에 사용되며 배포 빌드에 필수 |
| `AIT_BRAND_ICON_URL` | Variable | Apps in Toss 콘솔 앱 정보에 업로드한 앱 로고 이미지 URL. `granite.config.ts`의 `brand.icon`에 사용되며 배포 빌드에 필수 |
| `VITE_AD_GROUP_ID` | Secret | 운영 전면 광고 그룹 ID. caller가 `secrets:`로 넘기면 org 재사용 워크플로우가 **빌드 step의 env로만** 주입합니다(설치·업로드 step에는 전달하지 않음). 값이 비면 `isInterstitialSupported()`가 false가 되어 배포 빌드에서 광고가 노출되지 않으므로, caller는 `require_ad_group_id: true`로 그런 빌드가 조용히 나가지 않게 막습니다. `build_command`에서 다시 대입하면 주입된 값을 덮어쓰니 건드리지 마세요 |

배포는 GitHub Actions의 `Deploy AppsInToss` workflow를 `Run workflow`로 실행합니다(또는 `Release Tag`로 태그를 찍어 트리거). 루트에서 `npm run build`로 `match-picture-app.ait`를 만든 뒤 업로드/배포합니다.

## 환경 변수

| 키 | 설명 |
| --- | --- |
| `AIT_APP_DISPLAY_NAME` | Apps in Toss 콘솔 앱 정보에 제출한 앱 이름입니다. 공백 포함 여부까지 콘솔 값과 정확히 같아야 하며, `npm run build`에서는 필수입니다. `npm run dev`에서는 없으면 `같은그림찾기`를 사용합니다. |
| `AIT_BRAND_ICON_URL` | Apps in Toss 콘솔 앱 정보에 업로드한 앱 로고 이미지 URL입니다. 콘솔에서 업로드한 로고를 우클릭해 링크를 복사한 값을 넣어야 하며, `npm run build`에서는 필수입니다. `npm run dev`에서는 없으면 `public/icon.png`를 사용합니다. |
| `VITE_AD_GROUP_ID` | Apps in Toss 통합 광고(전면형) 그룹 ID. 콘솔에서 발급한 운영 ID를 `.env.production.local`에 설정합니다. 없으면 광고 노출이 비활성화됩니다. |

리더보드는 기본 활성화되어 있으며, 게임 클리어 시 점수를 제출하고 상단 HUD의 `RANK` 버튼과 결과 화면의 `RANKING` 버튼에서 열 수 있습니다. 콘솔에서 게임 센터/리더보드 설정이 완료되어 있어야 실제 토스 앱에서 정상 동작합니다.

## 게임 모드

| 모드 | 진입 방법 | 덱 시드 |
| --- | --- | --- |
| 클래식 | 기본 | 매판 무작위 |
| 오늘의 도전 | 시작 화면 모드 칩 / 홈의 "오늘의 도전" | KST 날짜 기반 시드. 모든 사용자가 같은 "오늘의 덱"을 플레이 |
| 지난 도전(아카이브) | 홈의 "지난 도전" | 선택한 날짜의 데일리 시드(최근 14일) |
| 도전장 | 공유 링크(`?challengeSeed=<uint32>&challengeTarget=<초>`) | 링크에 실린 시드. 보낸 사람과 같은 덱으로 대결 |
| 스테이지 | 홈의 "스테이지 도전" | 스테이지 번호 기반 고정 시드. 별 1~3개로 평가 |

- 클래식은 난이도(쉬움/보통/어려움)를 고를 수 있고 선택은 프로필에 저장됩니다. 데일리·도전장은 공정성을 위해 보통 난이도로 고정됩니다.
- 결과 화면의 공유 버튼은 이번 판의 덱 시드와 기록을 담은 도전장 링크를 공유합니다. 데일리 클리어는 정답을 노출하지 않는 라운드별 이모지 그리드로 공유됩니다. Apps in Toss 환경에서는 `getTossShareLink` + `share` 브릿지를 쓰고, 브라우저에서는 Web Share API → 클립보드 복사 순으로 fallback합니다.
- 글로벌 리더보드 제출 정책(`src/game/submission.ts`)
  - 도전장·스테이지: 제출하지 않습니다(공유 고정 덱 / 스테이지별 목표).
  - 데일리: 그날의 **첫 클리어만** 제출합니다(`match-picture/daily-submitted/<YYYY-MM-DD>`). 재도전은 로컬 베스트만 갱신하고 결과 화면에 "연습 기록" 안내가 뜹니다.
  - 지난 도전(아카이브): 제출하지 않습니다.
  - 클래식: 코인 파워업을 쓴 판은 제출하지 않고 개인 베스트도 갱신하지 않습니다.
- 베스트 기록은 클래식(`match-picture/best-seconds`)과 데일리(`match-picture/daily-best/<YYYY-MM-DD>`)에 각각 저장되어 결과 화면에서 신기록 여부를 보여줍니다.
- 라운드가 진행될수록 심볼 위치가 기본 배치에서 점점 멀어져(최대 ±90/650 좌표) 위치 암기를 막습니다. 배치는 덱 시드에서 파생된 결정적 RNG로 만들어져 같은 시드면 항상 같은 보드가 나오고, 심볼끼리 겹치지 않도록 최소 간격을 보장합니다.

## 심볼 테마(심볼팩)

시작 화면의 테마 칩에서 심볼 룩을 바꿀 수 있습니다. 선택은 `match-picture/symbol-pack`에 저장됩니다.

| 팩 | 에셋 | 설명 |
| --- | --- | --- |
| 클래식 | `public/symbols/*.png` | Unity 원본 NotoEmoji PNG |
| 픽셀 | `public/symbols/pixel/*.svg` | 12x12 픽셀 아트. 19개 모티프 x 3색 변형 = 57심볼 |
| 우주 | `public/symbols/space/*.svg` | 12x12 픽셀 아트 우주 테마(행성, UFO, 로켓 등). 19개 모티프 x 3색 변형 = 57심볼 |
| 악기 | `public/symbols/instrument/*.svg` | 12x12 픽셀 아트 악기/음악 테마(기타, 드럼, 음표 등). 19개 모티프 x 3색 변형 = 57심볼 |
| 바다 | `public/symbols/ocean/*.svg` | 12x12 픽셀 아트 바다/해변 테마(물고기, 문어, 등대, 닻 등). 19개 모티프 x 3색 변형 = 57심볼 |
| 음식 | `public/symbols/food/*.svg` | 12x12 픽셀 아트 음식/디저트 테마(사과, 피자, 햄버거, 핫도그, 도넛 등). 19개 모티프 x 3색 변형 = 57심볼 |

픽셀 아트 팩들은 `scripts/generate-<팩>-pack.mjs`의 ASCII 그리드에서 생성됩니다(공용 로직은 `scripts/pixelPackLib.mjs`). 모티프를 추가/수정한 뒤 다시 실행하면 SVG가 갱신됩니다.

```bash
node scripts/generate-pixel-pack.mjs
node scripts/generate-space-pack.mjs
node scripts/generate-instrument-pack.mjs
node scripts/generate-ocean-pack.mjs
node scripts/generate-food-pack.mjs
```

새 테마를 추가하려면 57개 에셋(`001`~`057`)을 `public/` 아래 디렉토리에 두고 `src/symbols/packs.ts`의 `SYMBOL_PACKS`에 항목을 추가하면 됩니다. 덱/룰 로직은 심볼 ID만 다루므로 코드 변경은 매니페스트 한 줄입니다.

출시 후 기능 kill-switch와 전면 광고 빈도는 **Firebase Remote Config**(프로젝트 `match-picture-app`)로 제어합니다. 정본은 `remoteconfig.template.json`이고, 반영은 `firebase deploy --only remoteconfig`입니다. RC를 읽지 못하는 환경에서는 `src/ait/launchConfig.ts`의 기본값으로 떨어집니다.

| 파라미터 | 타입 | 기본값 | 설명 |
| --- | --- | --- | --- |
| `leaderboardEnabled` | BOOLEAN | `true` | 리더보드 노출/제출 kill-switch |
| `reviewRequestEnabled` | BOOLEAN | `true` | 앱 리뷰 요청 kill-switch |
| `interstitialAdEnabled` | BOOLEAN | `true` | 전면 광고 kill-switch |
| `interstitialMinIntervalSeconds` | NUMBER | `120` | 전면 광고 최소 노출 간격(초) |
| `interstitialFreeGames` | NUMBER | `2` | 세션 시작 후 전면 광고 면제 게임 수 |

전면 광고를 긴급 중단하려면 `interstitialAdEnabled`를 `false`로 바꿔 배포하면 되고, 재배포 없이 빈도만 조절하려면 `interstitialMinIntervalSeconds`/`interstitialFreeGames`를 올립니다. kill-switch 전파를 위해 클라이언트 `minimumFetchIntervalMillis`는 1시간입니다(`src/firebase/remoteConfig.ts`).

개발 서버 세션에서만 한 번 맞추면 클리어되게 하려면 현재 URL에 `debugTotalCards=1`을 붙입니다. 이 값은 `npm run dev`에서만 동작하고 production build에서는 무시됩니다.

```bash
# 예: 브라우저 또는 dev WebView URL
http://localhost:5173/?debugTotalCards=1

# 세션 override 해제
http://localhost:5173/?debugTotalCards=reset
```

WebView에서 URL 변경이 어렵고 콘솔 접근이 가능하면 같은 세션에서 직접 설정할 수 있습니다.

```js
sessionStorage.setItem("match-picture/debug-total-cards", "1");
location.reload();

sessionStorage.removeItem("match-picture/debug-total-cards");
location.reload();
```

## 폴더 구조

```
src/
  App.tsx              Provider 트리(ErrorBoundary / i18n / 설정 / 프로필)
  app/                 탭 셸, 루트 에러 경계
  components/          카드 UI, HUD, 모달 등 프레젠테이션 컴포넌트
  screens/             홈(정원)·게임·상점·미션·설정 화면
  game/                Deck 알고리즘 / 게임 룰 / 배치 / 난이도 / 스테이지 / 제출 정책 + 단위 테스트
  state/               프로필·미션·정원·설정 상태(순수 로직 + Provider)
  ait/                 Apps in Toss 브릿지 어댑터(스토리지, 리더보드, 광고, 리뷰 등)
  native/              Capacitor 전용 어댑터(하드웨어 뒤로가기)
  platform/            Seorilabs Platform 세션 교환 로직
  firebase/            Analytics / Remote Config / 인증 진입점
public/symbols/        Unity Resources/NotoEmoji에서 가져온 심볼 PNG
public/audio/          효과음·BGM(scripts/generate-audio.mjs로 생성)
ops/                   운영 문서(Play 데이터 안전 공시 source-of-truth 등)
```

## 참고 링크

- [앱인토스 콘솔](https://apps-in-toss.toss.im/)
- [앱인토스 개발자센터](https://developers-apps-in-toss.toss.im/)
- [앱인토스 개발자 커뮤니티](https://techchat-apps-in-toss.toss.im/)
