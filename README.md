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

## GitHub Actions

CI/CD는 Seorilabs org 재사용 워크플로우(`seorilabs/.github/.github/workflows/*.yml@main`)를 호출하는 얇은 caller들로 구성됩니다.

| Caller | 트리거 | 호출하는 org 워크플로우 | 역할 |
| --- | --- | --- | --- |
| `static-checks.yml` | `push`/`pull_request`(main), dispatch | `rn-static-checks.yml` | `npm ci` → `npm run lint` + `npm test` 정적 게이트 |
| `deploy-apps-in-toss.yml` | dispatch, `workflow_call` | `rn-deploy-ait.yml` | 루트에서 `.ait` 빌드 → AppsInToss 배포 |
| `release-tag.yml` | dispatch | `release-tag.yml` | 명시적 SemVer 릴리즈 태그 생성 |
| `cleanup-actions-storage.yml` | dispatch | `cleanup-actions-storage.yml` | Actions 아티팩트/캐시 정리 |

main push/PR은 정적 체크만 돌고, 마켓 배포는 명시적 dispatch(또는 Release Tag)로만 실행됩니다. private repo는 ARC 러너(`seorilabs-rpi-arm64`), public은 `ubuntu-latest`로 라우팅됩니다.

Apps in Toss 배포를 위해 GitHub repository 또는 environment `apps-in-toss`에 아래 값을 설정해야 합니다.

| 이름 | 위치 | 설명 |
| --- | --- | --- |
| `APPS_IN_TOSS_API_KEY` | Secret | `ait deploy --api-key`에 사용할 Apps in Toss API key. org 재사용 워크플로우가 `secrets: inherit`로 읽습니다 |
| `AIT_APP_DISPLAY_NAME` | Variable | Apps in Toss 콘솔 앱 정보에 제출한 앱 이름. `granite.config.ts`의 `brand.displayName`에 사용되며 배포 빌드에 필수 |
| `AIT_BRAND_ICON_URL` | Variable | Apps in Toss 콘솔 앱 정보에 업로드한 앱 로고 이미지 URL. `granite.config.ts`의 `brand.icon`에 사용되며 배포 빌드에 필수 |
| `VITE_AD_GROUP_ID` | **Variable** | 운영 전면 광고 그룹 ID. org 재사용 워크플로우는 secret을 `with:`로 받을 수 없어 caller가 이 값을 **Variable**로 `build_command`에 주입합니다. Secret으로만 있으면 배포 빌드에서 광고가 비활성화되므로 **Secret → Variable로 이전**해야 합니다 |
| `VITE_REMOTE_CONFIG_URL` | Variable | 선택값. 기본값은 `https://config.vzyx.xyz/match-picture/launch-config.json` |
| `VITE_REMOTE_CONFIG_FALLBACK_URL` | Variable | 선택값. 독립 fallback host가 있을 때만 설정 |

배포는 GitHub Actions의 `Deploy AppsInToss` workflow를 `Run workflow`로 실행합니다(또는 `Release Tag`로 태그를 찍어 트리거). 루트에서 `npm run build`로 `match-picture-app.ait`를 만든 뒤 업로드/배포합니다.

## 환경 변수

| 키 | 설명 |
| --- | --- |
| `AIT_APP_DISPLAY_NAME` | Apps in Toss 콘솔 앱 정보에 제출한 앱 이름입니다. 공백 포함 여부까지 콘솔 값과 정확히 같아야 하며, `npm run build`에서는 필수입니다. `npm run dev`에서는 없으면 `같은그림찾기`를 사용합니다. |
| `AIT_BRAND_ICON_URL` | Apps in Toss 콘솔 앱 정보에 업로드한 앱 로고 이미지 URL입니다. 콘솔에서 업로드한 로고를 우클릭해 링크를 복사한 값을 넣어야 하며, `npm run build`에서는 필수입니다. `npm run dev`에서는 없으면 `public/icon.png`를 사용합니다. |
| `VITE_AD_GROUP_ID` | Apps in Toss 통합 광고(전면형) 그룹 ID. 콘솔에서 발급한 운영 ID를 `.env.production.local`에 설정합니다. 없으면 광고 노출이 비활성화됩니다. |
| `VITE_REMOTE_CONFIG_URL` | 선택값. 출시 후 기능을 끄기 위한 public HTTPS JSON URL입니다. 운영 기본값은 `https://config.vzyx.xyz/match-picture/launch-config.json`입니다. 쉼표로 여러 URL을 넣을 수 있습니다. |
| `VITE_REMOTE_CONFIG_FALLBACK_URL` | 선택값. 기본 URL이 내려갔을 때 추가로 시도할 public HTTPS JSON URL입니다. 같은 k8s 클러스터가 아닌 독립 호스트를 쓸 때만 설정합니다. 쉼표로 여러 URL을 넣을 수 있습니다. |

리더보드는 기본 활성화되어 있으며, 게임 클리어 시 점수를 제출하고 상단 HUD의 `RANK` 버튼과 결과 화면의 `RANKING` 버튼에서 열 수 있습니다. 콘솔에서 게임 센터/리더보드 설정이 완료되어 있어야 실제 토스 앱에서 정상 동작합니다.

## 게임 모드

| 모드 | 진입 방법 | 덱 시드 |
| --- | --- | --- |
| 클래식 | 기본 | 매판 무작위 |
| 오늘의 도전 | 시작 화면 모드 칩 | KST 날짜 기반 시드. 모든 사용자가 같은 "오늘의 덱"을 플레이 |
| 도전장 | 공유 링크(`?challengeSeed=<uint32>&challengeTarget=<초>`) | 링크에 실린 시드. 보낸 사람과 같은 덱으로 대결 |

- 결과 화면의 `SHARE` 버튼은 이번 판의 덱 시드와 기록을 담은 도전장 링크를 공유합니다. Apps in Toss 환경에서는 `getTossShareLink` + `share` 브릿지를 쓰고, 브라우저에서는 Web Share API → 클립보드 복사 순으로 fallback합니다.
- 도전장 모드 기록은 글로벌 리더보드에 제출하지 않습니다(공유받은 고정 덱이라 공정성 문제).
- 베스트 기록은 클래식(`match-picture/best-seconds`)과 데일리(`match-picture/daily-best/<YYYY-MM-DD>`)에 각각 저장되어 결과 화면에서 신기록 여부를 보여줍니다.
- 라운드가 진행될수록 심볼 위치가 기본 배치에서 점점 멀어져(최대 ±90/650 좌표) 위치 암기를 막습니다.

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

출시 후 리더보드, 리뷰 요청, 전면 광고를 긴급 비활성화하려면 `VITE_REMOTE_CONFIG_URL`이 가리키는 JSON을 아래처럼 바꿉니다. 해당 URL은 앱 WebView에서 `fetch`로 읽기 때문에 HTTPS와 CORS 허용이 필요합니다. 원격 설정을 성공적으로 읽으면 앱 Storage/localStorage에 마지막 성공값을 저장하고, 이후 설정 서버가 내려가면 저장된 값을 fallback으로 사용합니다.

```json
{
  "leaderboardEnabled": false,
  "reviewRequestEnabled": false,
  "interstitialAdEnabled": false
}
```

현재 k8s 운영 구성은 [ops/k8s/match-picture-config.yaml](/Users/syous/Repositories/seorilabs/match-picture-app/ops/k8s/match-picture-config.yaml)에 기록되어 있습니다. ConfigMap의 `launch-config.json`만 바꾸면 nginx가 같은 URL로 새 값을 서빙합니다.

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
  App.tsx              게임 화면 셸 + 모달 + 네이티브 연동
  components/          카드 UI, HUD, 모달 등 프레젠테이션 컴포넌트
  game/                Deck 알고리즘 / 게임 룰 / React 상태 훅 + 단위 테스트
  ait/                 Apps in Toss 브릿지 어댑터(스토리지, 리더보드, 리뷰 등)
public/symbols/        Unity Resources/NotoEmoji에서 가져온 심볼 PNG
```

## 참고 링크

- [앱인토스 콘솔](https://apps-in-toss.toss.im/)
- [앱인토스 개발자센터](https://developers-apps-in-toss.toss.im/)
- [앱인토스 개발자 커뮤니티](https://techchat-apps-in-toss.toss.im/)
