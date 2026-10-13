# MP-IOS-117 구현 자동 검증

- 실행 이슈: [#112](https://github.com/seorilabs/match-picture-app/issues/112), 승인 설계 `c92196f`.
- 2026-10-13: 구현 전 상태 회귀 테스트에서 18개 검사 중 10개 실패. 미결정·거부·제한·조회 실패·연결 누락·UMP 불허·동의 오류·권한 철회 광고 차단이 기존 코드에서 실패했다. 철회 테스트의 후속 배열 접근 오류도 로그에 기록됐으며 초기 실패를 PASS로 표시하지 않는다.
- 구현 후 상태 테스트 20건, 기존 안정성 59건 통과. 철회 후 재허용돼도 이전 세대 광고를 폐기하는 항목을 추가 확인한다.
- `npm run check` 통과: 코어 94, 기본 114, 플레이 35, 안정성 59, iOS 개인정보 20건; review sandbox 조립, 코어 경계·폰트·효과음·AdMob·순위표·Data safety·workflow caller 검사 통과.
- `tools/prepare_ios_privacy.py`: 공식 Poing 5.1.0 Godot 4.7.2 iOS 배포물 SHA-256 `6e7f1c807761f9c0ad45d335ac4c74acd4bba7a31f9e1c7cd16a5220010cce71`과 UMP 3.1.0 배포물 SHA-256 `90fe6bf3b0f4ce0d0199628c0871de58b6f673375148b98d52348aecc86db231` 확인. Godot 소스 `ed1daf0bf001b61586d9930840f2f1394092c079` 헤더로 iOS arm64 debug/release 네이티브 bridge 컴파일 완료.
- Python 문법·shell 문법·`git diff --check` 통과.

위 결과는 자동 검증·네이티브 라이브러리 컴파일이다. 실제 Editor Run, signed archive, Apple 권한창, Google 네트워크, iPhone/iPad 동작, App Privacy 저장, 재심사 접수를 증명하지 않는다. 현재 실제 iPad 검수 환경은 없다고 사용자가 확인했다.

- 별도의 깨끗한 Godot 4.7.2 clone으로 재현 검증: 기존 캐시에 있던 생성 헤더 때문에 초기 명령은 누락을 감추었으나, 필요한 `gdvirtual`, `gdextension_interface`, `disabled_classes` 생성 대상을 명시한 후 fresh 소스에서도 debug/release arm64 컴파일 통과. 재현 실패와 수정 후 결과를 구분한다.
