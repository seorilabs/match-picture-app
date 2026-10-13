# 1.1.7 재심사 준비 상태

- 2026-10-13 실시간 API 확인: 현재 버전 `1.1.6`은 `REJECTED`, 연결 빌드 `1001006`은 `VALID`.
- 앱: Match Symbols / `1528539634` / `com.github.magicsih.MatchSymbol`.
- 거절 항목: `5.1.2(i)`, GDPR 화면이 추적 동의를 요구하지만 ATT 요청 없음.
- 현재 공개 개인정보 미리보기: 사용자에게 연결되지 않은 데이터 5종. 실제 SDK와 일치하는지는 미완료.
- 현재 공개 버전: `1.0.4`. 새 버전 승인·공개를 의미하지 않는다.
- [수정 설계 MP-IOS-117 v1](../../../docs/design/2026-10-13-ios-1.1.7-ad-privacy/design.md): 커밋 `c92196f`의 v1을 2026-10-13 사용자가 승인했다. 구현 중.
- 목표: App Store `1.1.7`의 수정된 새 바이너리로 기존 제출 재심사 접수.
- 태그·최종 source SHA·빌드 번호·검수 근거: 아직 발급·실행하지 않음.
- 구현·native export·SDK manifest 대조·iPhone/iPad QA·App Privacy 저장·재심사: 미완료.
- 실제 iPhone 12 Pro가 연결되어 있다. 실제 iPad 검수 환경은 없다고 사용자가 확인했다. iPad QA는 미실행이다.
- 문서 내부 링크·코드 블록·`git diff --check`는 통과했다. 깨끗한 작업 경로의 `tools/check_admob_bundle.py`는 iOS debug/release native payload 누락으로 실패했다. 새 빌드 전에 같은 검증한 SDK 버전의 공식 배포물을 확보·대조해야 한다.

## 다음 검증

| 단계 | 완료 조건 | 현재 |
|---|---|---|
| 설계 | 정확한 v1 광고 동작과 범위 승인 | 승인, 커밋 `c92196f` |
| 구현 | ATT·UMP 상태와 광고 경로 연결, 거부/오류 차단 | 상태 회귀 20건 통과, 네이티브 연결 작업 중 |
| 개발 검수 | 3회 독립 검수와 전체 기능 E2E·중앙 검증 | 미실행 |
| 산출물 | 서명·실제 SDK·privacy manifest·용도 설명 대조 | 미실행 |
| 기기 | 같은 후보의 실제 iPhone/iPad 동의·광고·저장 확인 | 미실행 |
| 공개 정보 | 두 언어·개인정보·심사 메모 저장 후 대조 | 미실행 |
| 재심사 | 기존 제출에 최종 빌드 연결·실제 접수 read-back | 미실행 |

## 제출 문구 초안

**아래는 미구현 동작을 설명하는 준비용 초안이며 아직 저장하거나 제출하지 않았다.** 최종 후보의 검수 결과와 맞지 않으면 수정한다.

- What's New 한국어: `광고 개인정보 동의와 추적 허용 절차를 보완했어요.`
- What's New 영어: `Updated advertising consent and tracking permission handling.`
- Review Notes 초안: `On first launch, the app completes any required Google privacy consent form before requesting Apple's App Tracking Transparency permission when the system status is not determined. The request is independent of whether a GDPR form is required in the user's region. Advertising is initialized and requested only when ATT is authorized and the Google SDK permits ad requests. If permission is denied, restricted, or unresolved, the game remains fully playable without ads. Non-personalized ad requests remain enabled for users who authorize tracking. Ad privacy choices remain available in Settings when required by the Google SDK.`

SDK 데이터 유형·수집 목적·신원 연결·추적 답변은 최종 archive와 실제 설정·동작을 확인해 확정한다. 추정 답변을 저장하지 않는다.

- 실행 이슈: [#112](https://github.com/seorilabs/match-picture-app/issues/112). iPhone 미러링 연결은 확인했으나 제품 기기 QA를 수행한 것은 아니다.
