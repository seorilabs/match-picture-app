# 콘솔 후속 처리 기록 — 2026-09-22

이 기록은 `com.github.magicsih.MatchPictureUnity`와 App Store 앱 `1528539634`의
콘솔 값을 다시 읽은 결과다. 공개 식별자만 기록하며, 키·토큰·프로파일 내용은 넣지 않는다.

| 항목 | 상태 | 확인 근거 | 결과와 남은 조치 |
| --- | --- | --- | --- |
| 1. Play Games Services | 완료 | Play Console의 Match Picture 리더보드 화면에서 프로젝트 `694776397541`, `CgkI5f2Zn5wUEAIQAA`, `출시됨`, `모든 사용자 이용 가능`을 읽었다. Publishing API는 공식적으로 지원하지만 현재 `shared/google-play/publisher` 호출은 프로젝트 `138773558853`에서 API가 비활성화됐다는 HTTP 403을 반환했다. | 생성할 리소스는 없었다. 두 공개 ID를 설정과 카탈로그에 기록했다. Android 실기기 로그인·제출은 별도 QA다. |
| 2. Game Center | 사람 필요 | App Store Connect API `POST /v1/gameCenterLeaderboards`가 201을 반환했고, 이어진 `GET /v1/gameCenterDetails/cc7fe956-037a-362b-ab62-b447e8f4e1d9/gameCenterLeaderboards`에 `com.github.magicsih.MatchSymbol.leaderboard`, `BEST_SCORE`, `DESC`, `0..1000000`, `archived=false`가 있었다. 활성 배포 프로파일 `bdcca1a7-1034-44d4-a443-961a2bbe0cdb`에는 `com.apple.developer.game-center` entitlement가 없다. | 순위표 공개 ID는 설정과 카탈로그에 기록했다. Apple Developer의 Certificates, IDs & Profiles → Identifiers → `com.github.magicsih.MatchSymbol`에서 Game Center를 활성화하고, Profiles → `match-picture-app App Store`를 Game Center entitlement 포함 새 프로파일로 재발급·검증한 뒤 새 archive로 iOS QA가 필요하다. 순위표 릴리스도 만들지 않았다. |
| 3. AdMob 앱 표시 | 사람 필요 | AdMob 공식 API는 앱 표시 상태 변경을 제공하지 않는다. 로그인된 `ih@seorilabs.com` 계정의 Apps → View all apps → All hidden apps는 비어 있고, 카탈로그의 보관 ID `ca-app-pub-9932778305312246~8514815775`는 이 계정에서 찾을 수 없었다. 같은 Play 패키지의 다른 활성 앱 `ca-app-pub-2444587584524186~4836338367`은 대상이 아니다. | 카탈로그의 `pub-9932778305312246` 소유 계정으로 로그인한 뒤 Apps → View all apps → All hidden apps → 대상 행 체크 → App visibility → Show → Show을 수행하고, All visible apps에서 같은 앱 ID를 다시 확인한다. 보이기 전에는 카탈로그 lifecycle을 `live`로 바꾸지 않는다. |
| 4. Play Data safety | 사람 필요 | Android Publisher API에는 `POST applications.dataSafety`가 있으나 Console에서 내려받아 검토한 `safetyLabels` CSV를 쓰는 단방향 쓰기이며 GET readback이 없다. 저장소 JSON은 코드 정합성 원장일 뿐 Console 질문·최신 CSV를 안전하게 역생성하는 입력은 아니다. | Play Console → Match Picture → 정책 및 프로그램 → 앱 콘텐츠 → 데이터 보안 → 관리에서 JSON과 대조해 전송 중 암호화=예, 삭제 요청=아니요, App interactions=수집/비공유/Analytics, Crash logs=수집/비공유/Analytics, Device or other IDs=수집/공유/Analytics 및 Advertising or marketing으로 입력한다. 검토 화면을 저장하거나 제출한 뒤 화면 readback을 릴리스 기록에 붙인다. |
| 5. 저장소·카탈로그 연결 | 완료 | 각 ID는 위 콘솔/API 재조회에서 얻었다. `tools/check_leaderboard_bundle.py`는 ID 존재와 Android export의 프로젝트 ID 일치를 검사하도록 변경했고, `npm run check` 및 별도 순위표 검사가 통과했다. | `godot/leaderboard.config.json`, `godot/export_presets.cfg`, 카탈로그의 새 공개 식별자 항목을 같은 값으로 맞췄다. |

## API와 UI 판정

- Play Games Services: Publishing API로 생성·조회가 가능하지만, 현재 등록 자격증명은 해당 API가
  비활성화된 프로젝트에 묶여 있어 사용하지 않았다. Console readback으로 이미 존재하고 출시된
  리소스를 확인했다.
- App Store Connect: API로 순위표 생성·조회가 가능했고, 실제 생성과 재조회까지 마쳤다.
- AdMob: 앱 표시 상태는 Console UI 전용이다. 공식 API는 보고와 조회 범위이며 숨김 해제 작업을
  제공하지 않는다.
- Play Data safety: API 쓰기 엔드포인트는 존재하지만 안전한 현재값 조회나 JSON 변환 API가 없다.
  검토된 Console CSV가 있을 때만 API 쓰기가 가능하다.

## 인증 노출 계약 후속 수정

PR #98은 순위표 ID가 구성됐다는 사실과 사용자가 지금 순위표를 열 수 있다는 상태를 분리한다.
GameCenterKit의 `authenticated(ok, error)`와 `is_authenticated()`, GodotPlayGameServices의
`userAuthenticated(bool)`가 성공을 알리기 전에는 두 포트 모두 사용할 수 없다고 답한다.
인증이 결과 팝업을 연 뒤에 끝나면 그 팝업에는 버튼을 뒤늦게 추가하지 않고, 다음 판 결과에서
최신 상태를 읽는다. 이미 표시한 결과의 행동 수를 바꾸지 않으면서도 눌러도 동작하지 않는 버튼을
만들지 않는 fail-closed 선택이다.

## 공식 근거

- [Play Games Services Publishing API](https://developers.google.com/games/services/publishing/api/leaderboardConfigurations)
- [App Store Connect Game Center leaderboard 생성](https://developer.apple.com/documentation/appstoreconnectapi/post-v1-gamecenterleaderboards)
- [AdMob 앱 숨김·표시](https://support.google.com/admob/answer/6061403)
- [Android Publisher Data safety](https://developers.google.com/android-publisher/api-ref/rest/v3/applications/dataSafety)

## 이번 요청의 콘솔 공시·표시 상태

아래 표는 이 문서 상단의 과거 순위표 작업과 별개로, 이번 공시·표시 작업을 다시
확인한 결과다. `완료`는 콘솔 항목은 변경 뒤 화면을 다시 읽어 확인한 경우에만,
코드 항목은 변경 파일과 검사를 다시 읽어 확인한 경우에만 썼다.

| 항목 | 상태 | 확인 근거 | 결과와 남은 조치 |
| --- | --- | --- | --- |
| AdMob 카탈로그 lifecycle | 사람 필요 | 정본 `~/.config/seorilabs/catalog/apps.yaml`의 `app/match-picture-app/admob/public-identifiers`는 현재 `lifecycle: archived`다. 반면 credential 파일의 `ADMOB_LIFECYCLE=live`는 이전 작업이 바꾼 값이라 정본과 어긋난다. 이번 작업에서 `ILHWAN (Well known geek)` Chrome 프로필로 AdMob 대상 URL을 열어 readback을 재시도했지만, 공유 Chrome 창이 관찰 직후 사라져 대상 앱 화면을 현재값으로 다시 읽지 못했다. | 현재 콘솔 화면에서 앱 ID `ca-app-pub-9932778305312246~8514815775`와 `com.github.magicsih.MatchPictureUnity`가 보이는 앱인지 재확인한 뒤에만 `apps.yaml`을 `live`로 바꾸고 두 카탈로그 값을 일치시킨다. 그 전에는 정본을 `archived`로 유지한다. |
| 비개인화 AdMob 요청 코드 | 완료 | Poing v5.1.0의 `AdRequest.extras`가 공통 Google network extra 사전으로 전달되는 것을 vendored `godot/addons/admob/gdscript/src/api/core/AdRequest.gd`와 iOS payload의 `GADExtras` 변환으로 확인했다. `admob_interstitial_ads.gd`의 모든 전면광고 load 요청은 이제 `request.extras = {"npa": "1"}`을 설정하며, UMP 동의 흐름은 그대로다. | `tools/check_admob_bundle.py`가 이 exact extra를 검사하도록 추가했다. 이는 Android와 iOS 소스 계약 확인이며, 새 빌드 배포나 실기기 광고 QA는 아직 하지 않았다. |
| App Store App Privacy | 사람 필요 | 제품 결정은 추적=아니오, ATT 미구현이다. 위 비개인화 extra와 코드상 `ATTrackingManager`·`requestTrackingAuthorization`·`NSUserTrackingUsageDescription`·IDFA 직접 호출 부재가 그 결정을 뒷받침한다. 다만 App Store Connect의 독립 브라우저 컨텍스트를 확보하지 못해 저장·제출과 화면 readback은 하지 않았다. | Apple의 Tracking=아니오를 입력해야 한다. Google Mobile Ads SDK 문서는 IP 기반 대략 위치, 기기 ID, 광고 데이터, 앱 상호작용, 비사용자 연결 crash log, 사용자 연결 performance data를 신고 후보로 제시하고, GA4 코드는 저장된 임의 client ID·게임 이벤트·오류 메시지를 전송한다. 각 후보의 App Store "연결됨" 및 목적 분류가 확정된 뒤 입력한다. |
| Play Data safety | 사람 필요 | Play Console에서 개발자 계정 `Seolee Apps`와 대상 앱 `Match Picture` · `com.github.magicsih.MatchPictureUnity`를 앞선 세션에서 확인했다. 원장은 전송 중 암호화=예, 삭제 요청=아니요, App interactions=수집·비공유·Analytics, Crash logs=수집·비공유·Analytics, Device or other IDs=수집·공유·Analytics 및 Advertising or marketing을 지정한다. 공유 Chrome에는 독점 가능한 별도 프로필·컨텍스트가 없고, 대상 탭이 아닌 상태에서 양식을 건드리지 않았다. | 대상 화면이 `Match Picture`인지 매 단계 확인할 수 있는 세션에서 정책 및 프로그램 → 앱 콘텐츠 → 데이터 보안 → 관리로 들어가 위 값을 저장·제출한 뒤 같은 화면 readback을 남긴다. 특히 Device or other IDs의 공유=함을 유지한다. |

### 개인정보 판단에 사용한 공식 근거

- [Apple User Privacy and Data Use](https://developer.apple.com/app-store/user-privacy-and-data-use/): 타사 SDK 데이터도 앱 개인정보 신고에 포함하며, 다른 회사 데이터와 결합한 추적에는 ATT 권한이 필요하다고 명시한다.
- [Google Mobile Ads SDK의 App Store 데이터 공개](https://developers.google.com/admob/ios/privacy/data-disclosure): SDK가 수집할 수 있는 기기 식별자, 광고 데이터, 앱 상호작용, 진단 및 성능 데이터를 설명하고 앱 개발자가 신고를 최신으로 유지하도록 요구한다.
- [Google Mobile Ads SDK의 iOS IDFA 안내](https://developers.google.com/admob/ios/privacy/strategies): UMP와 ATT의 관계 및 ATT 거절 시 IDFA 전송 제한을 설명한다.
- [Google Mobile Ads SDK의 비개인화 광고 요청](https://developers.google.com/admob/android/next-gen/migration/migrate-ad-requests): Google network extra `npa` 값 `1`로 비개인화 광고를 요청하는 방법을 설명한다.
