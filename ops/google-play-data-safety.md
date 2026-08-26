# Google Play Data safety 갱신 절차

`ops/google-play-data-safety.json`이 이 앱의 Data safety 신고 **source-of-truth**다.
Play Console 입력값은 이 파일과 일치해야 하며, 코드와의 정합성은
`npm run check:data-safety`가 검사한다(정적 체크, CI/릴리스 preflight에서 실행).

## 왜 필요한가

Play 공개 listing이 `No data collected`로 남아 있는 동안에도 앱은 Firebase Analytics로
사용자 이벤트를 전송하고 GA4 BigQuery export에 적재되고 있었다. Play Console Data safety는
앱과 포함된 SDK의 수집/공유를 개발자가 정확히 신고해야 하고, 불일치는 enforcement 대상이다.

- Play Console Help — Data safety: https://support.google.com/googleplay/android-developer/answer/10787469

## 정적 체크가 잡는 것

- `trackEvent`/`logEvent` 사용 또는 `firebaseConfig.measurementId` 활성인데
  공시가 `no_data_collected: true`인 경우
- 수집 중인데 `App activity / App interactions` 공시가 없는 경우
- Firebase/광고 SDK가 있는데 `Device or other IDs` 공시가 없는 경우
- 반대로 계측을 모두 제거했는데 공시만 수집을 주장하는 경우

## 갱신 순서

1. 계측/SDK 변경 PR에서 `ops/google-play-data-safety.json`을 함께 수정한다.
2. `npm run check:data-safety`가 통과하는지 확인한다.
3. Play Console → 앱 콘텐츠 → 데이터 보안에서 같은 내용으로 신고를 갱신한다.
   (계정 권한이 필요한 수동 작업이라 저장소 자동화 대상이 아니다.)
4. 갱신 근거(Data safety 화면 스크린샷 또는 Console readback)를 릴리스 이슈/PR에 남긴다.

## 현재 신고 요약

| 항목 | 수집 | 공유 | 목적 | 근거 |
| --- | --- | --- | --- | --- |
| App activity / App interactions | O | X | Analytics | `src/firebase/analytics.ts`, `src/firebase/gameEvents.ts` |
| App info and performance / Crash logs | O | X | Analytics | `src/firebase/errorReporter.ts`, `src/app/ErrorBoundary.tsx` |
| Device or other IDs | O | X | Analytics, 광고 | `src/firebase/remoteConfig.ts`, `src/ait/ads.ts` |

전송 구간 암호화(TLS)는 Firebase/AppsInToss SDK 기본 동작이며, 계정 시스템이 없어
삭제 요청 대상 개인 데이터는 보관하지 않는다(로컬 진행 상태는 앱 삭제로 제거).
