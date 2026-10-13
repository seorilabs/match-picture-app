# MP-IOS-117 구현 자동 검증

- 실행 이슈: [#112](https://github.com/seorilabs/match-picture-app/issues/112), 승인 설계 `c92196f`.
- 2026-10-13: 구현 전 상태 회귀 테스트에서 18개 검사 중 10개 실패. 미결정·거부·제한·조회 실패·연결 누락·UMP 불허·동의 오류·권한 철회 광고 차단이 기존 코드에서 실패했다. 철회 테스트의 후속 배열 접근 오류도 로그에 기록됐으며 초기 실패를 PASS로 표시하지 않는다.
- 구현 후 상태 테스트 20건, 기존 안정성 59건 통과. 철회 후 재허용돼도 이전 세대 광고를 폐기하는 항목을 추가 확인한다.
- `npm run check` 통과: 코어 94, 기본 114, 플레이 35, 안정성 59, iOS 개인정보 20건; review sandbox 조립, 코어 경계·폰트·효과음·AdMob·순위표·Data safety·workflow caller 검사 통과.
- `tools/prepare_ios_privacy.py`: 공식 Poing 5.1.0 Godot 4.7.2 iOS 배포물 SHA-256 `6e7f1c807761f9c0ad45d335ac4c74acd4bba7a31f9e1c7cd16a5220010cce71`과 UMP 3.1.0 배포물 SHA-256 `90fe6bf3b0f4ce0d0199628c0871de58b6f673375148b98d52348aecc86db231` 확인. Godot 소스 `ed1daf0bf001b61586d9930840f2f1394092c079` 헤더로 iOS arm64 debug/release 네이티브 bridge 컴파일 완료.
- Python 문법·shell 문법·`git diff --check` 통과.

위 결과는 자동 검증·네이티브 라이브러리 컴파일이다. 실제 Editor Run, signed archive, Apple 권한창, Google 네트워크, iPhone/iPad 동작, App Privacy 저장, 재심사 접수를 증명하지 않는다. 현재 실제 iPad 검수 환경은 없다고 사용자가 확인했다.

- 별도의 깨끗한 Godot 4.7.2 clone으로 재현 검증: 기존 캐시에 있던 생성 헤더 때문에 초기 명령은 누락을 감추었으나, 필요한 `gdvirtual`, `gdextension_interface`, `disabled_classes` 생성 대상을 명시한 후 fresh 소스에서도 debug/release arm64 컴파일 통과. 재현 실패와 수정 후 결과를 구분한다.

## 코드 리뷰 후 검증

- `1fc334b`: ATT 타임아웃(-1)/OS 미결정 완료(0)/네이티브 미접수(false)에서 후속 명시적 재요청이 되지 않는 3건 실패를 먼저 확인했다. 수정 후 개인정보 27건과 전체 검사 통과.
- `f12f032`: 권한 변화 없이 복귀했을 때 실패한 광고가 다시 요청되는 1건 실패를 먼저 확인했다. 새로 허용된 복귀는 준비하고 기존 허용의 복귀는 상태·철회만 확인하도록 수정 후 개인정보 **29건**, 전체 검사 통과.
- 같은 후보의 GitHub CI [Godot compile and smoke](https://github.com/seorilabs/match-picture-app/actions/runs/38398414390) 통과. 기록 추가 뒤 CI는 다시 HEAD에서 확인한다.
- native bridge는 Object의 실제 SCons compile database에서 template debug/release 정의를 각각 추출한다. THREADS_ENABLED/debug 상태를 확인하고 같은 pinned source에서 arm64 두 라이브러리를 재컴파일했다. 컴파일 성공은 실제 객체 생성·OS 신호 왕복 검수가 아니다.
- archive manifest fixture 4건: 검토한 root/GMA/UMP 허용, 예상 밖 SDK 거부, root 수집 변화 거부, SDK 누락 거부. 실제 archive는 미실행이다.
- Claude 1회차의 P1 두 건과 P2 한 건을 수정했고 P3 요청 빈도 수정, 중앙 hook의 bash 호출 소명, 문서 상태 갱신을 기록했다. f12f032 수정 확인 2회차는 “지적 없음”. 원문과 처리 답변은 PR #113에 보존한다.

| 원문 로그 | SHA-256 |
|---|---|
| ATT 재요청 실패 | d8d8114ad80b74eefc97c6c29e95638760ae153d9925da3df7da1e25c45ab856 |
| 재요청 수정 후 전체 검사 | ff39a7cd5790eca942bf5b5526635a8b90e083c54e248767f786a86a1edbb66f |
| 복귀 요청 빈도 실패 | ed1b802e98a824e45b2511197b122b1fb76635e826d7a62c497fbbde07dffa7a |
| 최종 29건·전체 검사 | 3af43e04b7b2efc36b74e2f59c64ab4f9e4158c1410a3ea76c4d81ebce583258 |
| SCons 실제 옵션 재컴파일 | 0a8f66a16e01b89abb2f566c35de8885fa7cbfbcfcb444e727b8f2b07f2752a1 |

독립 Editor Run 결과는 회차 보고서에 따로 연결한다. 실제 native 개인정보·광고, 최종 전체 E2E, signed archive와 재심사는 여전히 미완료다.

최종 자동 검사·실패 재현·native 라이브러리 컴파일·Claude 원문과 답변·중앙 검증 거절 로그 9개는 개인 아티팩트 보관소의 `MP-IOS-117/root-verifications` 묶음에 복사하여 원본/복사 SHA-256 일치를 확인했다. 이 보존은 실제 native 실행의 대체 근거가 아니다. 기능 목록에는 실제 기반 기능 경로를 추가했으며 실제 통과한 기준 SHA가 없어 30일 근거 승계를 사용하지 않는다.
