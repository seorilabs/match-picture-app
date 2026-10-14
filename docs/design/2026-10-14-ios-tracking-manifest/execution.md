# MP-IOS-118 v1 실행 기록

- 승인 정본: 설계 커밋 `b2bbb2c324a12b6a517a0b2391f08794fdf6bf69`, [PR115](https://github.com/seorilabs/match-picture-app/pull/115).
- 사람 답변: **v1 승인 — 수정·예외·재심사·공개 진행**. iOS1.1.8/1001008의 수정·새 후보 실기기 예외·재심사·Apple 승인 후 공개를 승인했다.
- 실행 티켓: [#116](https://github.com/seorilabs/match-picture-app/issues/116).
- 만료: `2026-10-20T13:41:40Z`. 물리/native `not_verified/waived`, 전체 제품 E2E `blocked`를 유지한다.
- 변경: 기존 추적 선언과 수집·SDK 원문을 유지하면서 승인 도메인 두 개, Godot 주석 문법, 엄격 검사와 필수 CI 회귀 검사를 적용했다.
- TDD: 격리된 Godot ConfigFile 실행을 포함한 기존 검사에서 4실패·1오류를 확인한 뒤 13개 검사가 통과했다. 최초의 리소스 미준비 로그는 환경 실패이며 요구사항 RED와 구분해 개인 보관했다.
- 전체 `npm run check` 통과. 실제 서명 앱/새 후보 Editor/중앙 예외/업로드/메타데이터/재심사/승인/공개는 후속 단계다.
- 이전 v1.1.7/1001007와 그 grant는 변경하거나 재사용하지 않는다. 원본 검수 로그는 개인 보관과 CI 근거로 사용한다.

- 교차 리뷰의 root 부분 비교 지적을 수용했다. 실제 Godot4.7.2 project-only export에서 기존 API 접근 사유3개와 true/두 도메인을 읽고, 앱 원문 전체 및 Boolean 값 형식을 고정 비교했다. 추가 RED6→총16개 GREEN. 해당 export는 서명 archive·업로드 근거가 아니다.


## MP-IOS-118 v2 승인과 정상 caller 전환

- 사용자가 PR117의 정확한 커밋 `1a5b1a45b367d3129bd715954fe7a471cda4fdf7`의 변경 설계·test-plan.json과 승인 커밋을 보존하는 문서 merge를 승인했다. 실제 승인 응답은 `v2 승인 — 계획·문서 병합·출시 계속`이다. 원 승인 본문은 수정하지 않는다.
- 계획은 L3/dev, 다른 에이전트의 전체13개 기능 실제 Editor 실행, foundationRerun=true다. 물리/native not_verified/waived 및 전체 제품 E2E blocked를 유지하며 이번1.1.8/1001008의 실기기 하한3개만 2026-10-20T13:41:40Z까지 생략한다.
- 중앙 #248에 따라 새 grant를 등록하지 않는다. 사용자 추가 지침대로 App Store caller의 release_exception_id/configuration_fingerprint/release_verifier_sha를 dispatch/call/with 세 곳에서 모두 제거했다. 실제 수정 전 잔존9개로 실패, 수정 뒤 잔존0·해당키만 제거됨·오류0·actionlint 통과를 확인했다.
- 실제 최종 후보 SHA는 caller/문서 병합 뒤 고정한다. 7bb 준비 후보의 과거 기동·부분 실행·중단은 새 최종 후보 PASS가 아니다. v2 근거는 최종 SHA에서 새 독립 전체 실행으로 생성한다.
- 실제 1001008 서명·업로드·재심사·Apple 승인·App Store 공개는 아직 미실행이다. 기존1001007/grant/태그/CI 원본을 보존하고 새 후보에 재사용하지 않는다.
