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

## 공식 근거

- [Play Games Services Publishing API](https://developers.google.com/games/services/publishing/api/leaderboardConfigurations)
- [App Store Connect Game Center leaderboard 생성](https://developer.apple.com/documentation/appstoreconnectapi/post-v1-gamecenterleaderboards)
- [AdMob 앱 숨김·표시](https://support.google.com/admob/answer/6061403)
- [Android Publisher Data safety](https://developers.google.com/android-publisher/api-ref/rest/v3/applications/dataSafety)
