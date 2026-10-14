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
