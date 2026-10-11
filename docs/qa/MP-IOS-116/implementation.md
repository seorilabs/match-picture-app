# MP-IOS-116 구현·검증 기록

- 승인: 설계 v1 `b8ed807c73bd7b8769d101aecc8fbe89cc6b2f07`, 2026-10-11 대화 사용자 답변 `승인`.
- 실행 티켓: [#110](https://github.com/seorilabs/match-picture-app/issues/110).
- 인수조건: 설계 AC-1~AC-4 전체를 유지한다. [설계](../../design/2026-10-11-ios-1.1.6-stability/design.md).

## 테스트 우선 구현

`release_stability.tscn`을 기존 소스에서 실행해 요구사항 실패 17건을 확인했다. 최초 실행에서 테스트가 시작 전 게임의 splits를 요구하는 오류가 있어 테스트 시작 상태를 수정한 뒤 재실행했다. 이 환경/테스트 오류는 TDD 근거로 세지 않는다. 정상 재실행에는 SCRIPT ERROR/ERROR 없이 요구사항 실패가 나왔다.

실패: 쓰기 실패 시 메모리 보존, 일괄 저장 인터페이스, 정상 백업 보존, 최종 교체 실패 반환과 복구, 다음 판 광고 준비, 타이틀 설정, 실제 판 완료의 단일 쓰기/이전 기록/실패 알림/신기록 표시, iOS·Android 순위 시장과 AdMob 요청 분류, 표면 판정.

구현 후 `npm run check` 통과. 코어·엔진·한 판 통합·저장/광고/설정/시장 회귀를 실행했고 경계 14파일, 글리프 189종, 효과음 재현, AdMob/순위표 번들, 데이터 공개 선언, 중앙 workflow caller 4개도 통과했다. 실제 SDK/기기/스토어 검수의 대체 근거가 아니다.

## 실제 실행 환경

Godot 4.7.2 Editor Run의 1·2회차는 `tests/review_sandbox.tscn`을 사용했다. 제품 화면과 입력 경로는 그대로 두고 저장은 메모리, 광고 SDK는 대역으로 격리했다. F1 개인정보 필요 상태, F2 저장 실패, F3 양식 완료, F4 양식 실패, F7 렌더 캡처, F8 저장된 기존 기록으로 타이틀 복귀다. 가짜 UMP 양식이나 실제 노출 성공을 그리지 않는다. 이러한 대역 결과를 실기기 UMP/광고 노출 통과로 기록하지 않는다. 3회차는 저장·SDK 포트를 바꾸지 않은 정상 제품 main과 별도 디스크 저장 경로를 사용했다.

원본 사용자 저장과 프로젝트를 피하기 위해 회차용 프로젝트 복사본과 고유 식별자의 QA Godot 앱을 사용한다. 초기 override의 실행 도구 적용 실패와 잘못된 user dir 설정 키를 회차 기록에 보존했다. 실제 Run에 성공한 격리 복사본의 project.godot에는 공식 custom_user_dir_name과 QA 실행 환경 항목만 반영하고, 원본 후보 파일과 정확한 환경 diff·해시를 보존한다. 제품 Save 실행 전 실제 user://가 회차 전용인지 확인한다. 제품 worktree의 소스·에셋·project.godot은 바꾸지 않는다. 3회차 마지막 Run에서 Editor가 복사본 main.tscn의 UID/load_steps 메타데이터를 자동 직렬화한 차이도 원본·직렬화본·diff·해시로 보존했다. 행동 소스는 동일하지만 전체 파일의 byte 일치를 주장하지 않는다. 각 회차 계획·기능/UX 결과는 독립 검수자가 기록한다. 3회차 뒤 미완료 조건이 있으므로 4회차 전에 별도 승인을 받는다.

## 남은 단계

UI 독립 검수 3회는 종료했으나 최종 필수 항목이 모두 통과하지 않았다. [추가 UI 1회 제안](iteration-4-proposal.md)은 승인 전 미실행이다. UI 통과와 병합, 최종 후보 전체 기능 E2E·중앙 검증, App Store 빌드/업로드/처리, TestFlight iPhone/iPad, ko/en-US 문구·실제 스크린샷·지원 URL·개인정보 read-back, 심사·승인·공개·live를 별도로 진행한다. 중앙 gate의 미실행/차단을 통과로 표시하지 않는다.

1회차 실제 Editor에서 QA 씬의 `FormError.new()` 인수 누락을 발견했다. 실제 생성자 `(error_code, message)`로 수정하고 `review_sandbox.tscn`도 품질 게이트에서 로드하도록 추가했다. 수정 후 전체 검사와 QA 씬 조립 스모크가 통과했다. 회차의 초기 차단은 iteration-1.md에 보존한다.

Claude 1차 교차 리뷰의 초기 동의 갱신 문구·필요 상태 재확인·부분 파일 쓰기 지적을 수용해 실패 4건을 먼저 확인했다. 수정 후 신규 회귀 59건과 전체 302개 assertion이 통과했다. [지적별 처리](cross-review.md). PR은 [#111](https://github.com/seorilabs/match-picture-app/pull/111)이며 실제 UI·최종 E2E·실기기·마켓 단계는 완료 후 각각 갱신한다.

2차 교차 리뷰는 후보 `02e63ae`의 1차 이후 수정분을 확인해 지적 없음으로 완료했다. 동일 SHA GitHub Godot Checks 통과와 미해결 리뷰 thread 0개를 확인했다. Ready PR #111에는 최종 iOS 기기 인수조건을 미완료로 보존했다. [UI 2회차](iteration-2.md)는 sandbox의 정상/실패 저장 UX와 조건부 개인정보 대역을 확인했다. [3회차](iteration-3.md)는 embedded 시작 오류와 독립 창의 도구 입력 차단을 보존한 뒤 마지막 Run에서 실제 정상 main을 완주했다. headless Editor host가 공식 play_main_scene로 실행한 실제 GUI child를 독립 검수자가 조작했다. 540×720에서 최초 안내·10정답·9개 측정 구간·신기록82.887165초·완료1·설정·Retry·취소/Yes를 확인했고 primary와 .bak에 동일한 기록이 있다. 정상 primary 재시작·손상 primary의 .bak 복구·좁은 정상 main·세 화면비 입력 비교는 미검증이며 추가 Run은 시작하지 않았다.
