# 1.1.6 재제출 실행 순서

현재 실행하지 않은 계획이다. 앱 `1528539634`, bundle `com.github.magicsih.MatchSymbol`만 대상으로 한다. 버전·제출·빌드 상태와 계정을 다시 읽고 검수 완료 후보에만 적용한다.

1. 중앙 원장에서 `v1.1.6`의 최종 source SHA와 Apple 빌드 번호를 발급받는다. 최종 Editor E2E·중앙 검증 뒤 빌드·업로드하고 ASC에서 그 번호의 `VALID` 처리와 TestFlight 도달을 확인한다. iPhone/iPad 실제 SDK·게임 검수를 기록한다.
2. 현재 거절 버전 ID `1d36616f-cdc7-4d53-abcc-f3442c26a261`을 다시 조회한다. 예상 `REJECTED` 및 `1.1.5`가 바뀌면 작업을 중단하고 원인부터 확인한다. 기존 제출 `162856a7-6e04-4531-a840-53613e8df83e`의 해당 항목만 재사용한다. 철회·새 제출·항목 삭제를 하지 않는다.
3. 기존 버전의 `versionString`만 `1.1.6`으로 PATCH하고 최종 `VALID` 빌드를 연결한다. `releaseType=AFTER_APPROVAL`을 유지한다. 범용 `asc_release.py submit`은 버전 이름이 일치하지 않으면 새 버전을 만들고 rejected 항목의 resolved 갱신도 하지 않으므로 이 경로에 그대로 사용하지 않는다.
4. 활성 언어 `ko`, `en-US`의 승인 범위인 설명·supportUrl·What's New를 저장한다. 마켓별 release-notes 자산의 실제 내용과 일치해야 한다. 기존 이름·부제·키워드·홍보·가격·국가를 바꾸지 않는다. 새 후보의 실제 iPhone/iPad 이미지와 개인정보 개별 답변을 검수하고 저장 후 다시 읽는다.
5. 제출 직전 버전·build 관계·모든 활성 언어·이미지 처리 상태·개인정보·심사 정보를 다시 확인한다. 해당 rejected item을 `resolved=true`로 업데이트하고, 기존 review submission의 `submitted=true`로 재제출한다. 제출·버전 상태와 build를 다시 읽어 기록한다. 자동 출시 설정이므로 승인 이후 공개/live 확인도 별도로 필요하다.

## 정본

- [Apple unresolved 제출 처리](https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/manage-a-submission-with-unresolved-issues/): 거절된 항목을 편집하고 기존 제출을 재제출한다. unresolved 제출에는 새 항목을 추가할 수 없다.
- [버전 업데이트 API](https://developer.apple.com/documentation/appstoreconnectapi/patch-v1-appstoreversions-_id_): `AppStoreVersionUpdateRequest.Data.Attributes`에 `versionString`이 있다.
- [제출 항목 업데이트 API](https://developer.apple.com/documentation/appstoreconnectapi/patch-v1-reviewsubmissionitems-_id_): `ReviewSubmissionItemUpdateRequest.Data.Attributes`에 `resolved`가 있다. 2026-10-11 공식 문서 JSON에서 두 속성을 확인했다.

이 계획 문서는 Connect 변경·심사 제출·검수 통과의 증거가 아니다.
