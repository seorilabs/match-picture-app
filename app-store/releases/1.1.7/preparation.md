# 1.1.7 재심사 준비 상태

**후보 구현·자동 검사·코드 리뷰 완료 / 기기·전체 E2E·산출물·재심사 미완료**.

- 승인: MP-IOS-117 v1, `c92196fab6a302832c4919f71ff745cb3d280db6`. 사용자 답변: “v1 승인 — 수정·검수·재심사 진행”.
- 대상: Match Symbols / `1528539634` / `com.github.magicsih.MatchSymbol`, 예정 `1.1.7`.
- 마지막 실제 API 확인: `2026-10-13T12:23:44.320950Z`. 현재 `1.1.6`은 `REJECTED`, 제출은 `UNRESOLVED_ISSUES`, 연결 빌드 `1001006`은 `VALID`. 공개 버전은 `1.0.4`다.
- 거절: `5.1.2(i)`, GDPR 양식이 추적 동의를 요구하지만 ATT 요청이 없음.
- 현재 활성 언어: `en-US`, `ko`. 가격·지역·기존 `AFTER_APPROVAL` 값은 제출 단계에서 다시 확인한다.
- 실행 이슈 [#112](https://github.com/seorilabs/match-picture-app/issues/112), Ready PR [#113](https://github.com/seorilabs/match-picture-app/pull/113), [승인 설계](../../../docs/design/2026-10-13-ios-1.1.7-ad-privacy/design.md).
- 코드 검증 기준: `f12f032881619284bc45d0bbef380ea6fb173f26`. 기록 추가 커밋을 최종 출시 후보로 소급하지 않는다. 태그·빌드 번호는 미발급이며 최종 후보는 전체 검증 뒤 고정한다.

## 수행한 작업

| 단계 | 실제 결과 |
|---|---|
| 구현 | 실제 UMP canRequestAds+ATT 허용 전 SDK 초기화·광고 요청 차단, 철회·늦은 광고 폐기, 타임아웃/미접수 후 명시적 준비에서 복구. npa=1 유지 |
| 자동 검사 | 코어 94 / 기본 114 / 플레이 35 / 안정성 59 / 개인정보 29건과 전체 npm run check 통과 |
| 네이티브 컴파일 | 공식 배포물·Godot 소스 지문 확인, template별 SCons Object 옵션으로 arm64 debug/release 라이브러리 컴파일 통과. 앱 실행·archive 근거는 아님 |
| 코드 리뷰 | Copilot 3 thread 답변·해결. Claude 1회차 지적 수정/소명 후 f12f032 수정 확인은 “지적 없음” |
| 독립 실행 | Editor Run 3회차 수행. 실제 10정답·9구간·허용/거부 대역·Retry·설정·파일 저장·재시작·백업 복구. [회차별 원 SHA와 판정](../../../docs/qa/MP-IOS-117/review-plan.md) 유지 |
| 공개 문구 초안 | [두 언어 노트](release-notes.json), [심사 메모·URL 제안](metadata.draft.json), [검토 기록](metadata-text-review.json), [개인정보 유형](privacy-disclosure-draft.md), [앱별 고지](privacy-policy-draft.md). 저장·게시 안 함 |

초기 깨끗한 checkout의 iOS payload 누락은 공식 Poing 5.1.0 배포물 확보·해시 검증으로 해결했다. 기존 생성 헤더가 재현 실패를 감췄던 이력도 보존하고 fresh source에서 수정 후 컴파일했다. 이후 교차 리뷰에서 엔진 thread 매크로 누락을 발견하여 실제 SCons 옵션을 사용하는 경로로 다시 컴파일했다. 최초 컴파일 성공을 실제 기기 안정성의 증거로 바꾸지 않는다.

## 남은 조건

- 실제 iPhone 12 Pro가 연결되어 있으나 이번 후보를 설치하여 ATT·UMP·테스트 광고를 검수한 근거는 없다. 실제 iPad 환경은 없다고 사용자가 확인했다.
- 3회차는 `1fc334b`에서 실행했다. 후속 `f12f032`의 앱 복귀 광고 요청 빈도 수정은 자동 회귀로 확인했으며 3회차 GUI 결과에 소급하지 않는다. 실제 권한·광고 및 후속 변경 재확인은 별도로 남는다.
- 후보 전체 기능 E2E와 최신 중앙 검증이 통과하지 않았다. 중앙 `793b016...`의 검증기 실행은 실제 `DEVELOPMENT_EVIDENCE_ARCHIVE_MISSING`으로 거절됐다. 빈 PASS 파일을 만들거나 빌드 전 검사를 생략하지 않는다.
- signed archive·서명·네이티브 연결·두 언어 권한창·실제 SDK manifest·사용자 저장 보존 검수는 미실행이다. 추가/누락 SDK와 root 수집 변화는 검증기에서 거부한다.
- 기존 개인정보 공개 5개 유형·추적 없음·신원 비연결과 실제 SDK 선언의 불일치를 조사했다. 최종 앱·설정 대조 후 앱별 페이지 게시/URL 확인, App Privacy 유형별 저장, 모든 활성 언어·이미지·저장값 read-back을 수행해야 한다.
- 기존 버전 ID `1d36616f-cdc7-4d53-abcc-f3442c26a261`과 제출 ID `162856a7-6e04-4531-a840-53613e8df83e`를 다시 읽고 1.1.7 최종 빌드로 수정·재접수한다. 현재는 수정·업로드·재접수 모두 미실행이다.

[출시 원장](market-launch-state.json)은 `submitted` 목표의 미완료 상태다. 검증 결과 `complete=false`, 구조 오류 0개이며 실제 미충족 gate를 유지한다. 코드 병합·업로드·심사·승인·공개는 각각 별도 상태다.
