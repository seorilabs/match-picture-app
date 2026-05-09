# 앱인토스 개발자센터

> 앱인토스 개발자센터

## Table of Contents

### 시작

- [앱인토스 Unity 적용 가이드](https://developers-apps-in-toss.toss.im/unity/intro/overview.md)

### 준비

- [동작 방식](https://developers-apps-in-toss.toss.im/unity/guide/runtime-structure.md)
- [전환 점검](https://developers-apps-in-toss.toss.im/unity/guide/precheck.md)
- [권장 Unity 엔진 버전](https://developers-apps-in-toss.toss.im/unity/guide/recommend-engine.md)

### SDK

- [시작하기](https://developers-apps-in-toss.toss.im/unity/sdk/getting-started.md): 앱인토스 Unity SDK의 설치부터 첫 번째 빌드까지의 전체 과정을 안내해요.
- [연동 순서](https://developers-apps-in-toss.toss.im/unity/intro/migration-guide.md)
- [수동 연동](https://developers-apps-in-toss.toss.im/unity/porting-tutorials/unity.md): Unity 게임을 앱인토스 미니앱으로 직접 연동하는 가이드예요. Unity WebGL 빌드 및 앱인토스 연동 방법을 확인할 수 있어요.

#### 개발 가이드

- [API 사용 패턴](https://developers-apps-in-toss.toss.im/unity/sdk/api-usage-patterns.md): 앱인토스 Unity SDK의 API 사용 패턴을 설명해요. async/await, 에러 처리, Mock 브릿지 동작 방식을 안내해요.
- [로딩 화면 커스터마이징](https://developers-apps-in-toss.toss.im/unity/sdk/loading-screen.md): 앱인토스 Unity SDK의 로딩 화면 커스터마이징 방법을 안내해요. 커스텀 HTML, JavaScript API, 예제를 확인할 수 있어요.
- [화면 가시성 처리](https://developers-apps-in-toss.toss.im/unity/sdk/visibility.md): 앱 가시성 변경 이벤트를 Unity에서 처리하는 방법을 안내해요. 오디오 일시정지, 게임 상태 관리 등에 활용할 수 있어요.

#### API 레퍼런스

- [인증](https://developers-apps-in-toss.toss.im/unity/sdk/api-authentication.md): 앱인토스 Unity SDK의 인증 API 레퍼런스예요.
- [시스템 정보](https://developers-apps-in-toss.toss.im/unity/sdk/api-system-info.md): 앱인토스 Unity SDK의 시스템 정보 API 레퍼런스예요.
- [공유](https://developers-apps-in-toss.toss.im/unity/sdk/api-share.md): 앱인토스 Unity SDK의 공유 API 레퍼런스예요. 공유 링크 생성, 연락처 바이럴 등을 안내해요.
- [스토리지](https://developers-apps-in-toss.toss.im/unity/sdk/api-storage.md): 앱인토스 Unity SDK의 스토리지 API 레퍼런스예요.
- [내비게이션](https://developers-apps-in-toss.toss.im/unity/sdk/api-navigation.md): 앱인토스 Unity SDK의 내비게이션 API 레퍼런스예요.
- [Safe Area](https://developers-apps-in-toss.toss.im/unity/sdk/api-safe-area.md): 앱인토스 Unity SDK의 Safe Area API 레퍼런스예요.
- [게임 센터](https://developers-apps-in-toss.toss.im/unity/sdk/api-game-center.md): 앱인토스 Unity SDK의 게임 센터 API 레퍼런스예요.
- [기타 API](https://developers-apps-in-toss.toss.im/unity/sdk/api-other.md): 앱인토스 Unity SDK의 기타 API 레퍼런스예요. 사용자 키, 프로모션 리워드, 리뷰 요청 등을 안내해요.

##### 권한

- [권한 설정](https://developers-apps-in-toss.toss.im/unity/sdk/api-permission.md): 앱인토스 Unity SDK의 권한 설정 API 레퍼런스예요.
- [클립보드](https://developers-apps-in-toss.toss.im/unity/sdk/api-clipboard.md): 앱인토스 Unity SDK의 클립보드 API 레퍼런스예요.
- [위치](https://developers-apps-in-toss.toss.im/unity/sdk/api-location.md): 앱인토스 Unity SDK의 위치 정보 API 레퍼런스예요.
- [미디어](https://developers-apps-in-toss.toss.im/unity/sdk/api-media.md): 앱인토스 Unity SDK의 미디어 API 레퍼런스예요.
- [연락처](https://developers-apps-in-toss.toss.im/unity/sdk/api-contacts.md): 앱인토스 Unity SDK의 연락처 API 레퍼런스예요.

#### 빌드

- [빌드 프로세스](https://developers-apps-in-toss.toss.im/unity/sdk/build-process.md): 앱인토스 Unity SDK의 전체 빌드 파이프라인을 상세히 설명해요. 초기화, WebGL 빌드, 패키징 과정을 안내해요.
- [빌드 프로필](https://developers-apps-in-toss.toss.im/unity/sdk/build-profiles.md): 앱인토스 Unity SDK의 빌드 프로필 시스템을 설명해요. 개발, 테스트, 배포 각 단계에 최적화된 빌드 설정을 안내해요.
- [빌드 커스터마이징](https://developers-apps-in-toss.toss.im/unity/sdk/build-customization.md): 앱인토스 Unity SDK의 빌드 커스터마이징 방법을 안내해요. index.html, npm 패키지, Vite 플러그인, React 컴포넌트 등을 커스터마이징할 수 있어요.

#### 샘플 코드

- [인앱 광고](https://developers-apps-in-toss.toss.im/unity/porting-tutorials/iaa.md): 앱인토스 Unity SDK를 사용한 인앱 광고 연동 방법을 안내해요.
- [인앱 결제](https://developers-apps-in-toss.toss.im/unity/porting-tutorials/iap.md): 앱인토스 Unity SDK를 사용한 인앱 결제(IAP v2) 연동 방법을 안내해요.

### 최적화

- [성능 최적화 가이드](https://developers-apps-in-toss.toss.im/unity/optimization/perf-optimization.md)
- [성능 최적화 평가 기준](https://developers-apps-in-toss.toss.im/unity/optimization/perf-measure.md)
- [Unity WebGL 런타임 성능 최적화 가이드](https://developers-apps-in-toss.toss.im/unity/optimization/runtime/performance.md)
- [파티클 최적화](https://developers-apps-in-toss.toss.im/unity/optimization/runtime/particle.md)

#### 시작 최적화

- [게임 시작 속도 향상](https://developers-apps-in-toss.toss.im/unity/optimization/start/startup-speed.md)
- [시작 시간 최적화](https://developers-apps-in-toss.toss.im/unity/optimization/start/startup-sequence.md)
- [시작 스토리 디자인 가이드](https://developers-apps-in-toss.toss.im/unity/optimization/start/launch-opera.md)
- [첫 씬 시작 최적화 가이드](https://developers-apps-in-toss.toss.im/unity/optimization/start/first-scene-optimization.md)

#### 로딩 최적화

- [로딩 최적화](https://developers-apps-in-toss.toss.im/unity/optimization/start/loading.md)
- [커스텀 로딩 화면](https://developers-apps-in-toss.toss.im/unity/optimization/start/custom-loading.md)
- [코드 분할 도구 사용 가이드](https://developers-apps-in-toss.toss.im/unity/optimization/start/wasm-split.md)

#### 리소스 최적화

- [에셋 최적화](https://developers-apps-in-toss.toss.im/unity/optimization/runtime/asset.md)
- [압축 텍스처 최적화](https://developers-apps-in-toss.toss.im/unity/optimization/runtime/compressed-texture.md): Unity 앱인토스 미니앱 런타임 최적화 가이드입니다. 실행 중 성능 및 메모리 최적화 방법을 확인하세요.
- [비디오 및 오디오 최적화](https://developers-apps-in-toss.toss.im/unity/optimization/runtime/audio-video.md)

#### 리소스 로딩

- [리소스 로딩 최적화](https://developers-apps-in-toss.toss.im/unity/optimization/start/resource-loading.md)
- [AssetBundle 가이드](https://developers-apps-in-toss.toss.im/unity/optimization/start/assetbundle.md)
- [Addressable 가이드](https://developers-apps-in-toss.toss.im/unity/optimization/start/addressables.md)
- [AutoStreaming 가이드](https://developers-apps-in-toss.toss.im/unity/optimization/start/autostreaming.md)
- [사전 다운로드 가이드](https://developers-apps-in-toss.toss.im/unity/optimization/start/preload.md)

#### 성능 분석 도구

- [성능 프로파일링](https://developers-apps-in-toss.toss.im/unity/optimization/runtime/profile.md)
- [Android 프로파일링](https://developers-apps-in-toss.toss.im/unity/optimization/runtime/android-profiling.md)
- [Unity Profiler](https://developers-apps-in-toss.toss.im/unity/optimization/runtime/unity-profiler.md)
- [심화 분석 도구](https://developers-apps-in-toss.toss.im/unity/optimization/runtime/deep-profile-tool.md)

#### 플랫폼별 최적화

- [iOS 최적화](https://developers-apps-in-toss.toss.im/unity/optimization/runtime/ios.md)
- [iOS 전력 최적화](https://developers-apps-in-toss.toss.im/unity/optimization/runtime/ios-power.md)

#### 메모리 최적화

- [Unity WebGL 메모리 최적화 가이드](https://developers-apps-in-toss.toss.im/unity/optimization/runtime/memory.md)

#### 렌더링 최적화

- [렌더링 최적화](https://developers-apps-in-toss.toss.im/unity/optimization/runtime/rendering.md)
- [EmscriptenGLX 렌더링 모드 가이드](https://developers-apps-in-toss.toss.im/unity/optimization/runtime/emscripten-glx.md)
- [URP 파이프라인 커스터마이징](https://developers-apps-in-toss.toss.im/unity/optimization/runtime/custom-urp.md)
- [WebGL 2.0 렌더링](https://developers-apps-in-toss.toss.im/unity/optimization/runtime/webgl2.md)

### 디버깅

- [Unity WebGL 디버깅 및 예외 처리 가이드](https://developers-apps-in-toss.toss.im/unity/debug/debug-exception.md)
- [SDK 이벤트 로깅](https://developers-apps-in-toss.toss.im/unity/sdk/metrics.md): 앱인토스 Unity SDK에서 자동 수집하는 런타임 이벤트를 정리해요.
- [Sentry 통합](https://developers-apps-in-toss.toss.im/unity/sdk/sentry-integration.md): 앱인토스 Unity SDK와 Sentry 통합 방법을 안내해요. 자동 컨텍스트 주입, CI/CD 설정 등을 확인할 수 있어요.
- [문제 해결](https://developers-apps-in-toss.toss.im/unity/sdk/troubleshooting.md): 앱인토스 Unity SDK 사용 중 발생할 수 있는 문제와 해결 방법을 안내해요.

### 시작

- [앱인토스 오버뷰](https://developers-apps-in-toss.toss.im/overview-card.md)

#### 이해하기

- [앱인토스란](https://developers-apps-in-toss.toss.im/intro/overview.md): 앱인토스(Apps in Toss)는 토스 앱 내에서 서비스를 앱인앱 형태로 제공하는 플랫폼입니다. 3,000만 토스 유저에게 바로 노출하고, SDK와 API를 활용해 빠르게 개발하며, 다양한 솔루션으로 성장할 수 있습니다.
- [서비스 오픈 프로세스](https://developers-apps-in-toss.toss.im/intro/onboarding-process.md): 앱인토스 미니앱 서비스 오픈 프로세스를 단계별로 안내합니다. 콘솔 등록부터 디자인, 개발, 검수, 출시까지 전 과정을 확인하세요.
- [서비스 오픈 정책](https://developers-apps-in-toss.toss.im/intro/guide.md): 앱인토스 미니앱 출시를 위한 필수 정책 가이드입니다. 제한되는 서비스, 추가 확인이 필요한 카테고리, 자사 앱 설치 및 외부 링크 제한 정책을 확인하세요.
- [서비스별 주의사항](https://developers-apps-in-toss.toss.im/intro/caution.md): 앱인토스 서비스 유형별 주요 정책과 유의사항을 확인하세요. 웹보드 게임과 데이팅/만남 서비스, 민감 콘텐츠에 대한 법적 준수 요건, 운영 요구사항, 안전 관리 정책을 안내합니다.

#### 시작하기

- [콘솔에서 앱 등록하기](https://developers-apps-in-toss.toss.im/prepare/console-workspace.md): 앱인토스 콘솔에서 미니앱을 등록하는 과정을 안내합니다. 회원가입, 워크스페이스 설정, 멤버 초대, 미니앱 등록하는 과정을 확인하세요. 미니앱을 등록할 때에는 앱 로고, 앱 이름, appName, 사용 연령, 고객센터 이메일/연락처/채팅 상담 주소 등을 안내하고 게임/비게임 별 카테고리 및 검색을 등록하는 방법을 안내해요. 특히 게임의 경우, 게임 등급분류 관련 내용을 상세히 안내해요.
- [사업자 등록하기](https://developers-apps-in-toss.toss.im/prepare/register-business.md): 앱인토스 사업자 등록 및 계약 진행하는 과정을 안내합니다. 개인 사업자, 법인 사업자 별 등록해야하는 서류를 상세히 안내하고, 사업자 정보 검토가 완료되면 계약을 진행하는 방법을 안내해요. 앱인토스는 사업자가 없어도 앱을 출시할 수 있어 관련 내용도 상세히 안내해요.
- [미성년자 콘솔 참여방법](https://developers-apps-in-toss.toss.im/prepare/console-minor.md)

### 디자인

- [Untitled](https://developers-apps-in-toss.toss.im/design/overview.md)
- [토스 디자인 시스템 (TDS)](https://developers-apps-in-toss.toss.im/design/components.md): 앱인토스 미니앱 개발을 위한 토스 디자인 시스템(TDS) 가이드입니다. 컴포넌트, UX 라이팅, 그래픽 리소스 등 디자인 요소를 확인하세요.
- [피그마/TDS Mobile UI Kit 라이선스](https://developers-apps-in-toss.toss.im/design/prepare/figma-ui-license.md)

#### UI/UX 가이드

- [미니앱 브랜딩 가이드](https://developers-apps-in-toss.toss.im/design/miniapp-branding-guide.md): 앱인토스 미니앱 브랜딩 가이드입니다. 브랜드 로고, 이름, 컬러, 내비게이션 바, 브릿지, 탭바 등 브랜드 요소 적용 가이드를 확인하세요.
- [다크패턴 방지 정책](https://developers-apps-in-toss.toss.im/design/consumer-ux-guide.md): 앱인토스 다크패턴 방지 정책입니다. 고객의 예상을 벗어난 설계를 피하고 일관되고 신뢰할 수 있는 사용자 경험을 제공하기 위한 필수 가이드를 확인하세요.
- [UX 라이팅](https://developers-apps-in-toss.toss.im/design/ux-writing.md): 토스 보이스톤을 적용한 UX 라이팅 가이드입니다. 해요체, 능동적 말하기, 한 줄로 말하기, 버튼 작성법 등 일관된 사용자 경험을 위한 문구 작성 원칙을 확인하세요.
- [그래픽](https://developers-apps-in-toss.toss.im/design/resources.md): 토스가 제공하는 그래픽 리소스 가이드입니다. 아이콘, 이모지, 스마트폰 목업, 일러스트레이션 등 그래픽 자산과 활용 방법을 확인하세요.
- [해상도](https://developers-apps-in-toss.toss.im/design/resolution.md): 앱인토스 미니앱 개발을 위한 해상도 가이드입니다. 풀스크린 환경을 전제로 논리 해상도·에셋 해상도 권장 기준과 데이터 기반 viewport 분포, 테스트 기기 선정 기준을 안내합니다.

#### 디자인 준비하기

- [피그마](https://developers-apps-in-toss.toss.im/design/prepare/design.md): 피그마를 이용한 앱인토스 미니앱 디자인 가이드입니다. TDS 컴포넌트 라이브러리, 에셋 활용, 색상 적용, 반응형 디자인 방법을 확인하세요.
- [앱빌더](https://developers-apps-in-toss.toss.im/design/prepare/deus.md): 앱인토스 파트너사를 위한 UI 디자인 툴 앱빌더 사용 가이드입니다. 프로젝트 생성, 컴포넌트 활용, 반응형 디자인, 개발자 모드 등 앱빌더 기능을 확인하세요.

### 개발

- [Untitled](https://developers-apps-in-toss.toss.im/development/overview.md)
- [바이브 코딩으로 미니앱 만들기](https://developers-apps-in-toss.toss.im/tutorials/ai-vibe-coding.md): 코드를 잘 몰라도 괜찮아요. AI와 함께라면 누구나 앱인토스 미니앱을 만들 수 있어요.

#### 시작하기

- [WebView](https://developers-apps-in-toss.toss.im/tutorials/webview.md): 앱인토스 미니앱을 WebView로 개발 시작할 때 사용하는 튜토리얼입니다. WebView로 프로젝트를 스캐폴딩하는 방법들을 담고 있습니다.
- [React Native](https://developers-apps-in-toss.toss.im/tutorials/react-native.md): 앱인토스 미니앱을 React Native로 개발 시작할 때 사용하는 튜토리얼입니다. React Native로 프로젝트를 스캐폴딩하는 방법들을 담고 있습니다.
- [AI 개발 가이드](https://developers-apps-in-toss.toss.im/development/llms.md): IDE에서 AI가 더 정확한 코드를 생성할 수 있도록 컨텍스트 파일을 사용하는 방법을 안내합니다. llms.txt, 문서 URL, @docs 기능을 활용하여 프로젝트 정보를 AI에게 주입해 보세요.

#### 디버깅하기

- [디버깅하기](https://developers-apps-in-toss.toss.im/learn-more/debugging-webview.md)
- [디버깅하기](https://developers-apps-in-toss.toss.im/learn-more/debugging.md): 앱인토스 미니앱 디버깅 방법을 안내합니다. Chrome DevTools, React DevTools, 에러 처리 등 개발 도구 활용법을 확인하세요.

#### 테스트하기

- [Android 환경설정](https://developers-apps-in-toss.toss.im/development/client/android.md): React Native 앱인토스 개발을 위한 Android 환경 설정 가이드입니다. Android Studio, SDK Command-line Tools 설치 및 환경 변수 설정 방법을 확인하세요.
- [iOS 환경설정](https://developers-apps-in-toss.toss.im/development/client/ios.md): React Native 앱인토스 개발을 위한 iOS 환경 설정 가이드입니다. Xcode 설치, Command Line Tools 설정, 시뮬레이터 실행 및 샌드박스 앱 설치 방법을 확인하세요.
- [테스트앱(샌드박스)](https://developers-apps-in-toss.toss.im/development/test/sandbox.md): 앱인토스 샌드박스 앱을 이용한 개발 및 테스트 가이드입니다. 샌드박스 앱 설치, 로그인, 앱 선택, 로컬 서버 연결 방법을 확인하세요.
- [토스앱](https://developers-apps-in-toss.toss.im/development/test/toss.md): 토스 앱에서 미니앱을 테스트하는 방법을 안내합니다. 앱 번들 생성 및 업로드, QR 코드 테스트, 피처 테스트 방법을 확인하세요.

#### 연동 & 운영

- [API 사용하기](https://developers-apps-in-toss.toss.im/development/integration-process.md): 앱인토스 API 사용을 위한 mTLS 기반 서버 간 통신 설정 가이드입니다. 인증서 발급, 통신 구조, 언어별 API 요청 예제를 확인하세요.
- [Firebase 연동하기](https://developers-apps-in-toss.toss.im/firebase/intro.md)
- [Supabase 연동하기](https://developers-apps-in-toss.toss.im/supabase/intro.md): 앱인토스(미니앱) WebView 환경에서 Supabase를 연동하는 방법을 안내해요.
- [Sentry 설정하기](https://developers-apps-in-toss.toss.im/learn-more/sentry-monitoring.md): Sentry를 이용한 앱인토스 미니앱 모니터링 가이드입니다. 에러 추적 및 성능 모니터링 방법을 확인하세요.

#### 토스 로그인

- [이해하기](https://developers-apps-in-toss.toss.im/login/intro.md): 토스로그인 기능에 대한 개괄적인 소개입니다. 토스로그인에 대해 파악하기 위해 참고해주세요.
- [콘솔 가이드](https://developers-apps-in-toss.toss.im/login/console.md): 토스 로그인 콘솔 사용 가이드입니다. 설정, 관리, 모니터링 방법을 확인하세요.
- [개발하기](https://developers-apps-in-toss.toss.im/login/develop.md): 토스 로그인 개발 가이드입니다. SDK 연동, API 사용법, 구현 예제를 확인하세요.
- [QA 진행하기](https://developers-apps-in-toss.toss.im/login/qa.md): 토스 로그인 자주 묻는 질문과 답변입니다. 주요 이슈 해결 방법을 확인하세요.

#### 유저 식별키 발급

- [이해하기](https://developers-apps-in-toss.toss.im/user-hash-key/intro.md): 유저 식별키 발급 서비스 소개입니다. 주요 기능, 혜택, 적용 방법을 확인하세요.
- [개발하기](https://developers-apps-in-toss.toss.im/user-hash-key/develop.md): 유저 식별키 발급 개발 가이드입니다. SDK 연동, API 사용법, 구현 예제를 확인하세요.
- [토스 로그인 마이그레이션](https://developers-apps-in-toss.toss.im/user-hash-key/migration.md)

#### 토스 인증

- [토스 인증](https://developers-apps-in-toss.toss.im/tossauth/contract.md): 토스인증에 대한 소개입니다. 신원인증이 필요한 서비스인 경우 참고해주세요.
- [테스트하기](https://developers-apps-in-toss.toss.im/tossauth/test.md): 토스인증 구현 시 테스트 방법에 대한 가이드입니다. 테스트 환경을 통해 어떻게 테스트하는지 구체적인 가이드가 담겨있습니다.
- [개발하기](https://developers-apps-in-toss.toss.im/tossauth/develop.md): 토스 인증 개발 가이드입니다. SDK 연동, API 사용법, 구현 예제를 확인하세요.

#### 토스애즈 픽셀 연동

- [토스애즈 픽셀 연동](https://developers-apps-in-toss.toss.im/tosspixel/console.md): 토스애즈 픽셀 연동에 대한 소개입니다. 광고 전환 추적 시 참고해 주세요.
- [개발하기](https://developers-apps-in-toss.toss.im/tosspixel/develop.md): 토스애즈 픽셀 연동 개발 가이드입니다.

### 출시

#### 검수하기

- [게임 출시 가이드](https://developers-apps-in-toss.toss.im/checklist/app-game.md): 게임 미니앱 출시 전 필수 체크리스트입니다. 내비게이션 바, 사운드, 등급 표기, 디자인 가이드 준수 등 출시 검토 통과를 위한 상세 가이드를 확인하세요.
- [비게임 출시 가이드](https://developers-apps-in-toss.toss.im/checklist/app-nongame.md): 비게임 미니앱 출시 전 필수 체크리스트입니다. 내비게이션 바, 토스 로그인, 결제, 디자인 가이드 등 출시 검토 통과를 위한 상세 가이드를 확인하세요.

#### 출시하기

- [미니앱 출시](https://developers-apps-in-toss.toss.im/development/deploy.md): 앱인토스 미니앱 출시 프로세스를 안내합니다. 검토 요청, 출시하기, 버전 관리, 롤백, 긴급 수정 등 출시 후 관리 방법을 확인하세요.
- [앱 내 기능](https://developers-apps-in-toss.toss.im/development/test/function.md): 앱인토스 콘솔에서 앱 내 기능을 설정하는 방법을 안내합니다. 사용자가 특정 기능으로 바로 진입할 수 있도록 앱 내 기능을 등록하고 관리하세요.
- [미니앱 긴급 점검 설정](https://developers-apps-in-toss.toss.im/development/check.md): 앱인토스 미니앱 긴급 점검 프로세스를 안내합니다. 콘솔에서 미니앱 서비스 점검 일정을 사전에 설정하여, 점검 중인 미니앱에 진입하는 사용자에게 미니앱 서비스 점검 안내하는 방법을 확인하세요.
- [서비스 종료하기](https://developers-apps-in-toss.toss.im/prepare/service-termination.md): 앱인토스 미니앱 서비스 종료 유형별 프로세스, 고지 의무, 환불 처리 방식, 종료 후 약관 철회 방법을 안내해요.

### 마케팅

- [Untitled](https://developers-apps-in-toss.toss.im/marketing/overview.md)
- [OG 이미지](https://developers-apps-in-toss.toss.im/marketing/open-graph.md)

#### 세그먼트

- [이해하기](https://developers-apps-in-toss.toss.im/segment/intro.md)
- [콘솔 가이드](https://developers-apps-in-toss.toss.im/segment/console.md): 세그먼트 콘솔 사용 가이드입니다. 설정, 관리, 모니터링 방법을 확인하세요.

#### 스마트 발송

- [이해하기](https://developers-apps-in-toss.toss.im/smart-message/intro.md): 스마트 발송 서비스 소개입니다. 주요 기능, 혜택, 적용 방법을 확인하세요.
- [콘솔 가이드](https://developers-apps-in-toss.toss.im/smart-message/console.md): 스마트 발송 사용 가이드입니다. 설정, 관리, 모니터링 방법을 확인하세요.
- [개발하기](https://developers-apps-in-toss.toss.im/smart-message/develop.md): 푸시 알림 개발 가이드입니다. SDK 연동, API 사용법, 구현 예제를 확인하세요.
- [QA 진행하기](https://developers-apps-in-toss.toss.im/smart-message/qa.md): 푸시 알림 자주 묻는 질문과 답변입니다. 주요 이슈 해결 방법을 확인하세요.

#### 프로모션 (토스 포인트)

- [이해하기](https://developers-apps-in-toss.toss.im/promotion/intro.md): 프로모션(토스 포인트) 서비스 소개입니다. 주요 기능, 혜택, 적용 방법을 확인하세요.
- [콘솔 가이드](https://developers-apps-in-toss.toss.im/promotion/console.md): 프로모션(토스 포인트) 콘솔 사용 가이드입니다. 설정, 관리, 모니터링 방법을 확인하세요.
- [개발하기](https://developers-apps-in-toss.toss.im/promotion/develop.md)
- [QA 진행하기](https://developers-apps-in-toss.toss.im/promotion/qa.md): 프로모션(토스 포인트) 자주 묻는 질문과 답변입니다. 주요 이슈 해결 방법을 확인하세요.

#### 게임 프로필 & 리더보드

- [이해하기](https://developers-apps-in-toss.toss.im/game-center/intro.md): 게임 센터 서비스 소개입니다. 주요 기능, 혜택, 적용 방법을 확인하세요.
- [개발하기](https://developers-apps-in-toss.toss.im/game-center/develop.md): 게임 센터 개발 가이드입니다. SDK 연동, API 사용법, 구현 예제를 확인하세요.
- [QA 진행하기](https://developers-apps-in-toss.toss.im/game-center/qa.md): 게임 센터 자주 묻는 질문과 답변입니다. 주요 이슈 해결 방법을 확인하세요.

#### 공유 리워드

- [이해하기](https://developers-apps-in-toss.toss.im/reward/intro.md): 공유 리워드 서비스 소개입니다. 주요 기능, 혜택, 적용 방법을 확인하세요.
- [콘솔 가이드](https://developers-apps-in-toss.toss.im/reward/console.md): 공유 리워드 콘솔 사용 가이드입니다. 설정, 관리, 모니터링 방법을 확인하세요.
- [개발하기](https://developers-apps-in-toss.toss.im/reward/develop.md): 공유 리워드 개발 가이드입니다. SDK 연동, API 사용법, 구현 예제를 확인하세요.
- [QA 진행하기](https://developers-apps-in-toss.toss.im/reward/qa.md): 공유 리워드 자주 묻는 질문과 답변입니다. 주요 이슈 해결 방법을 확인하세요.

#### 분석하기

- [대시보드](https://developers-apps-in-toss.toss.im/analytics/dashboard.md): 데이터 분석 대시보드 사용 가이드입니다. 지표 확인 및 분석 방법을 확인하세요.
- [로그(이벤트) 가이드](https://developers-apps-in-toss.toss.im/analytics/logging.md)
- [전환 지표](https://developers-apps-in-toss.toss.im/analytics/conversion-metrics.md)

#### 성장 가이드

- [시작하기](https://developers-apps-in-toss.toss.im/growth/intro.md): 앱인토스 앱 성장 가이드입니다. 사용자 유입, 리텐션, 바이럴 확산 등 성장의 모든 단계를 설계하는 방법을 확인하세요.
- [사용자 유입 만들기](https://developers-apps-in-toss.toss.im/growth/traffic.md): 앱인토스 사용자 유입 가이드입니다. 세그먼트, 푸시, 토스 홈 광고, 프로모션을 활용해 효과적으로 사용자를 유입하는 방법을 확인하세요.
- [사용자 리텐션 확보하기](https://developers-apps-in-toss.toss.im/growth/retention.md): 앱인토스 사용자 리텐션 확보 가이드입니다. 세그먼트, 푸시, 토스 홈 광고를 활용한 맞춤형 커뮤니케이션으로 리텐션을 높이는 방법을 확인하세요.
- [공유 기능으로 바이럴 효과 만들기](https://developers-apps-in-toss.toss.im/growth/share.md): 앱인토스 공유 기능을 통한 바이럴 효과 가이드입니다. 공유하기 기능과 공유 리워드를 활용해 자연스러운 사용자 확산을 만드는 방법을 확인하세요.
- [데이터 기반 성장 인사이트 만들기](https://developers-apps-in-toss.toss.im/growth/insight.md): 앱인토스 데이터 기반 성장 인사이트 가이드입니다. DAU, 리텐션 등의 지표를 활용해 앱 성장을 분석하고 다음 액션을 계획하는 방법을 확인하세요.

### 수익화

- [Untitled](https://developers-apps-in-toss.toss.im/revenue/overview.md)

#### 인앱 광고

- [이해하기](https://developers-apps-in-toss.toss.im/ads/intro.md): 인앱 광고 인앱 광고 개괄적인 소개입니다. 인앱 광고에 대해 이해할 수 있습니다.
- [콘솔 가이드](https://developers-apps-in-toss.toss.im/ads/console.md): 인앱 광고 콘솔 사용 가이드입니다. 설정, 관리, 모니터링 방법을 확인하세요.
- [개발하기](https://developers-apps-in-toss.toss.im/ads/develop.md): 인앱 광고 개발 방법입니다. 앱인토스에서 인앱광고를 개발할 때 참고해주세요.
- [QA 진행하기](https://developers-apps-in-toss.toss.im/ads/qa.md): 인앱 광고 자주 묻는 질문과 답변입니다. 주요 이슈 해결 방법을 확인하세요.

#### 인앱 결제

- [이해하기](https://developers-apps-in-toss.toss.im/iap/intro.md)
- [콘솔 가이드](https://developers-apps-in-toss.toss.im/iap/console.md)
- [개발하기](https://developers-apps-in-toss.toss.im/iap/develop.md)
- [QA 진행하기](https://developers-apps-in-toss.toss.im/iap/qa.md): 인앱 결제 자주 묻는 질문과 답변입니다. 주요 이슈 해결 방법을 확인하세요.

#### 토스 페이

- [이해하기](https://developers-apps-in-toss.toss.im/tosspay/intro.md)
- [콘솔 가이드](https://developers-apps-in-toss.toss.im/tosspay/console.md): 토스페이 콘솔 사용 가이드입니다. 설정, 관리, 모니터링 방법을 확인하세요.
- [개발하기](https://developers-apps-in-toss.toss.im/tosspay/develop.md): 토스페이 개발 가이드입니다. SDK 연동, API 사용법, 구현 예제를 확인하세요.
- [QA 진행하기](https://developers-apps-in-toss.toss.im/tosspay/qa.md): 토스페이 자주 묻는 질문과 답변입니다. 주요 이슈 해결 방법을 확인하세요.

#### 정산

- [이해하기](https://developers-apps-in-toss.toss.im/settlement/intro.md): 앱인토스 정산 방법에 대한 프로세스를 소개합니다.

### API & SDK

#### API 레퍼런스

- [시작하기](https://developers-apps-in-toss.toss.im/api/overview.md): 앱인토스 API 개요입니다. 사용 가능한 API 목록과 인증 방법을 확인하세요.

##### 토스 로그인

- [Untitled](https://developers-apps-in-toss.toss.im/api/refreshOauth2Token.md)
- [Untitled](https://developers-apps-in-toss.toss.im/api/generateOauth2Token.md)
- [Untitled](https://developers-apps-in-toss.toss.im/api/removeByUserKey.md)
- [Untitled](https://developers-apps-in-toss.toss.im/api/removeByAccessToken.md)
- [Untitled](https://developers-apps-in-toss.toss.im/api/loginMe.md)

##### 프로모션(토스 포인트)

- [Untitled](https://developers-apps-in-toss.toss.im/api/getExecutionResult.md)
- [Untitled](https://developers-apps-in-toss.toss.im/api/executePromotion.md)
- [Untitled](https://developers-apps-in-toss.toss.im/api/getKey.md)

##### 토스 페이

- [Untitled](https://developers-apps-in-toss.toss.im/api/removeBillingKey.md)
- [Untitled](https://developers-apps-in-toss.toss.im/api/refundPayment.md)
- [Untitled](https://developers-apps-in-toss.toss.im/api/makePayment.md)
- [Untitled](https://developers-apps-in-toss.toss.im/api/getPaymentStatus.md)
- [Untitled](https://developers-apps-in-toss.toss.im/api/getBillingKeyStatus.md)
- [Untitled](https://developers-apps-in-toss.toss.im/api/executePayment.md)
- [Untitled](https://developers-apps-in-toss.toss.im/api/executeBilling.md)
- [Untitled](https://developers-apps-in-toss.toss.im/api/createBillingKey.md)

##### 인앱 결제

- [Untitled](https://developers-apps-in-toss.toss.im/api/getIapOrderStatus.md)

##### 푸시, 알림

- [Untitled](https://developers-apps-in-toss.toss.im/api/sendTestMessage.md)
- [Untitled](https://developers-apps-in-toss.toss.im/api/sendMessage.md)
- [Untitled](https://developers-apps-in-toss.toss.im/api/sendBulkMessage.md)

#### SDK 레퍼런스

- [한 눈에 보기](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/시작하기/overview.md)
- [개요](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/시작하기/intro.md): 앱인토스 Granite에 대해 소개하고 있습니다.
- [이벤트 제어하기](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/이벤트 제어/back-event.md)
- [WebView의 속성 제어하기](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/속성 제어/webview-props.md)
- [필요한 권한 설정하기](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/권한/permission.md)
- [로케일 가져오기 (`getLocale`)](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/언어/getLocale.md)

##### 마이그레이션

- [SDK 2.x 마이그레이션](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/시작하기/SDK2.0.1.md)

##### 공통

- [공통 설정](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/UI/Config.md)
- [환경 변수 설정 (React Native)](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/환경 변수/env.md)

##### 화면 구조 · 내비게이션

- [화면 이동](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/화면 이동/routing.md)
- [레이아웃](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/UI/Layout.md): Bedrock 프레임워크 레퍼런스 문서입니다.
- [내비게이션 바 설정](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/UI/NavigationBar.md)

##### 스타일

- [Flex](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/style-utils/Flex.md)
- [Spacing](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/style-utils/Spacing.md)
- [Stack](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/style-utils/Stack.md)
- [margin](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/style-utils/margin.md)
- [padding](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/style-utils/padding.md)
- [Overlay](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/overlay/useOverlay.md)

##### UI 컴포넌트

- [Image](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/UI/Image.md)
- [Lottie](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/UI/Lottie.md)
- [BlurView](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/UI/BlurView.md)
- [Video](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/UI/Video.md)

##### 화면 제어

- [Safe Area 여백 값 구하기](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/화면 제어/safe-area.md)
- [스크롤 뷰에서 요소 감지하기](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/화면 제어/intersection-observer.md)
- [화면 방향 설정하기](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/화면 제어/setDeviceOrientation.md)
- [화면 항상 켜짐 설정하기](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/화면 제어/setScreenAwakeMode.md)
- [화면 캡처 차단하기](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/화면 제어/setSecureScreen.md)
- [쿼리 파라미터 사용하기](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/화면 제어/useParams.md)
- [화면 복귀 후 코드 실행하기](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/화면 제어/useWaitForReturnNavigator.md)
- [외부 URL 열기](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/화면 이동/openURL.md)

###### 노출/가시성 감지하기

- [요소 노출 감지하기](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/화면 제어/InView.md)
- [컴포넌트 노출 감지하기](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/화면 제어/ImpressionArea.md)
- [스크롤 영역 노출 감지하기](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/화면 제어/IOScrollView.md)
- [리스트 항목 노출 감지하기](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/화면 제어/IOFlatList.md)
- [화면 보임 여부 확인하기](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/화면 제어/useVisibility.md)
- [가시성 변경 감지하기](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/화면 제어/useVisibilityChange.md)

###### 네비게이션 제어하기

- [화면 닫기](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/화면 제어/closeView.md)
- [iOS 스와이프 설정하기](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/화면 제어/setIosSwipeGestureEnabled.md)
- [뒤로가기 이벤트 제어하기](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/화면 제어/useBackEvent.md)

##### 인터렉션

- [인터렉션](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/인터렉션/interaction.md)
- [미니앱 리뷰 요청 (`requestReview`)](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/인터렉션/requestReview.md)

##### 인증 · 로그인

- [토스 로그인 (`appLogin`) - 인가 코드 받기](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/로그인/appLogin.md)
- [토스 로그인 연동 확인 (`getIsTossLoginIntegratedService`)](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/로그인/getIsTossLoginIntegratedService.md)
- [유저 식별키 발급 (`getUserKeyForGame`) - 게임](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/게임/getUserKeyForGame.md)
- [유저 식별키 발급 (`getAnonymousKey`) - 비게임](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/비게임/getAnonymousKey.md)

###### 토스 인증

- [인증 화면 호출](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/인증/tosscertRequest.md)
- [개인정보 암복호화](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/인증/tosscertEncrypt.md)
- [세션키 생성](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/인증/tosscertSessionKey.md)

##### 콘텐츠

- [인앱 광고 2.0](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/광고/loadAppsInTossAdMob.md)

###### 공통

- [공유 리워드 (`contactsViral`)](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/친구초대/contactsViral.md)

####### 공유하기

- [토스앱 공유 링크 만들기 (`getTossShareLink`)](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/공유/getTossShareLink.md)
- [메시지 공유하기 (`share`)](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/공유/share.md)

###### 게임

- [게임 프로모션(토스 포인트)](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/게임/grantPromotionRewardForGame.md)
- [게임 리더보드](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/게임/submitGameCenterLeaderBoardScore.md)

###### 비게임

- [비게임 프로모션(토스 포인트)](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/비게임/promotion.md)

###### 결제

- [토스 페이](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/토스페이/TossPay.md)
- [인앱 결제](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/인앱 결제/IAP.md)

###### 인앱 광고 2.0 ver2

- [인앱 광고 2.0 ver2 (전면형/보상형 광고)](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/광고/IntegratedAd.md)
- [인앱 광고 2.0 ver2 (배너 광고 - WebView)](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/광고/BannerAd.md)
- [인앱 광고 2.0 ver2 (배너 광고 - React Native)](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/광고/RN-BannerAd.md)

##### 분석

- [사용자 행동 기록하기](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/분석/Analytics.md)

###### 사용자 행동 기록하기

- [분석 초기 설정하기](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/분석/init.md)
- [영역 단위로 기록하기](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/분석/LoggingArea.md)
- [컴포넌트 노출 기록하기](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/분석/LoggingImpression.md)
- [클릭 이벤트 기록하기](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/분석/LoggingPress.md)

##### 디바이스

###### 위치 정보

- [현재 위치 가져오기](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/위치 정보/getCurrentLocation.md)
- [실시간 위치 추적하기](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/위치 정보/startUpdateLocation.md)
- [훅으로 위치 사용하기](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/위치 정보/useGeolocation.md)

####### 타입 · 객체

- [정확도 옵션](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/위치 정보/Accuracy.md)
- [위치 정보 객체](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/위치 정보/Location.md)
- [좌표 정보](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/위치 정보/LocationCoords.md)

###### 저장소

- [네이티브 저장소 이용하기](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/저장소/Storage.md)

###### 카메라

- [카메라로 사진 촬영하기](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/카메라/openCamera.md)

###### 사진

- [앨범 가져오기](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/사진/fetchAlbumPhotos.md)

###### 클립보드

- [클립보드 텍스트 가져오기](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/클립보드/getClipboardText.md)
- [클립보드 텍스트 복사하기](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/클립보드/setClipboardText.md)

###### 데이터

- [파일 저장하기](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/데이터/saveBase64Data.md)

###### 연락처

- [연락처 가져오기](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/연락처/fetchContacts.md)

##### 네트워크 · 환경

###### 네트워크

- [네트워크 연결 상태 확인하기](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/네트워크/getNetworkStatus.md)
- [HTTP 통신하기](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/네트워크/http.md)

###### 환경 확인

- [기기 고유식별자 확인하기](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/환경 확인/getDeviceId.md)
- [애플리케이션 환경 확인하기](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/환경 확인/getOperationalEnvironment.md)
- [토스앱 버전 가져오기](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/환경 확인/getTossAppVersion.md)
- [앱 최소 버전 확인하기](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/환경 확인/isMinVersionSupported.md)
- [실행중인 플랫폼 확인하기](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/환경 확인/getPlatformOS.md)
- [스킴 값 가져오기](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/환경 확인/getSchemeUri.md)
- [서버 시간 가져오기 (`getServerTime`)](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/환경 확인/getServerTime.md)

### 지원

- [자주 묻는 질문](https://developers-apps-in-toss.toss.im/faq.md): 앱인토스 및 Granite 기반 미니앱 개발과 운영에 관한 자주 묻는 질문과 답변을 확인하세요. 콘솔, 디자인, 개발, API, 결제, 마케팅 등 주요 주제별로 정리되어 있습니다.
- [릴리즈 노트](https://developers-apps-in-toss.toss.im/release-note.md): 앱인토스 제품, API, SDK의 새로운 기능과 변경 사항을 확인하세요. 주요 업데이트와 릴리즈 노트를 한눈에 볼 수 있습니다.
- [보도자료 가이드](https://developers-apps-in-toss.toss.im/checklist/publicity.md): 앱인토스 미니앱 서비스의 보도자료 배포 가이드입니다. 배포 절차, 제목 템플릿, 작성 리소스, 표현 가이드, 앱인토스 로고 활용 방법을 확인하세요.
- [외부 광고 가이드](https://developers-apps-in-toss.toss.im/marketing/guideline.md): 앱인토스 미니앱 서비스 외부 광고 및 마케팅 가이드입니다. 마케팅 메시지 작성법, 토스 미니앱 배지, 디자인 템플릿, 앱인토스 로고 활용 방법을 확인하세요.

### Other

- [## 광고 보여주기 (`showAppsInTossAdMob`)](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/광고/showAppsInTossAdMob.md)
- [Asset](https://developers-apps-in-toss.toss.im/design/components/common_asset.md): 토스 디자인 시스템(TDS)의 Asset 컴포넌트 가이드입니다. 아이콘, 이미지, 비디오 등 미디어 에셋 표시 방법을 확인하세요.
- [Badge](https://developers-apps-in-toss.toss.im/design/components/badge.md): 토스 디자인 시스템(TDS)의 Badge 컴포넌트 가이드입니다. 항목의 상태를 강조하는 배지 컴포넌트 사용법을 확인하세요.
- [Border](https://developers-apps-in-toss.toss.im/design/components/border.md): 토스 디자인 시스템(TDS)의 Border 가이드입니다. 테두리 스타일 및 사용법을 확인하세요.
- [BottomCTA](https://developers-apps-in-toss.toss.im/design/components/bottomcta.md): 토스 디자인 시스템(TDS)의 BottomCTA 컴포넌트 가이드입니다. 화면 하단 고정 CTA 버튼 사용법을 확인하세요.
- [Button](https://developers-apps-in-toss.toss.im/design/components/button.md): 토스 디자인 시스템(TDS)의 Button 컴포넌트 가이드입니다. 사용자 액션을 트리거하는 버튼 컴포넌트 사용법을 확인하세요.
- [ColorPreference](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/UI/ColorPreference.md)
- [ColorPreference](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/코어/ColorPreference.md): Bedrock 프레임워크 레퍼런스 문서입니다.
- [FetchAlbumPhotosPermissionError](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/사진/FetchAlbumPhotosPermissionError.md)
- [FetchContactsPermissionError](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/연락처/FetchContactsPermissionError.md)
- [GetClipboardTextPermissionError](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/클립보드/GetClipboardTextPermissionError.md)
- [GetCurrentLocationPermissionError](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/위치 정보/GetCurrentLocationPermissionError.md)
- [Granite](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/코어/Bedrock.md)
- [Granite 프로퍼티](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/코어/InitialProps.md)
- [IAP 정기결제](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/인앱 결제/subscription.md)
- [KeyboardAboveView](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/UI/KeyboardAboveView.md)
- [ListHeader](https://developers-apps-in-toss.toss.im/design/components/listHeader.md): 토스 디자인 시스템(TDS)의 ListHeader 컴포넌트 가이드입니다. 목록 헤더 구성 및 사용법을 확인하세요.
- [ListRow](https://developers-apps-in-toss.toss.im/design/components/list.md): 토스 디자인 시스템(TDS)의 ListRow 컴포넌트 가이드입니다. 리스트 아이템 구성 및 사용법을 확인하세요.
- [Navigation](https://developers-apps-in-toss.toss.im/design/components/navigation.md): 토스 디자인 시스템(TDS)의 Navigation 컴포넌트 가이드입니다. 화면 상단 네비게이션 바 구성 및 사용법을 확인하세요.
- [OnAudioFocusChanged](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/UI/OnAudioFocusChanged.md)
- [OpenCameraPermissionError](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/카메라/OpenCameraPermissionError.md)
- [RNVideoRef](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/UI/RNVideoRef.md)
- [ScrollViewInertialBackground](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/UI/ScrollViewInertialBackground.md)
- [SetClipboardTextPermissionError](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/클립보드/SetClipboardTextPermissionError.md)
- [StartUpdateLocationPermissionError](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/위치 정보/StartUpdateLocationPermissionError.md)
- [Tab](https://developers-apps-in-toss.toss.im/design/components/tab.md): 토스 디자인 시스템(TDS)의 Tab 컴포넌트 가이드입니다. 탭 네비게이션 구성 및 사용법을 확인하세요.
- [Tabbar](https://developers-apps-in-toss.toss.im/design/components/tabbar.md): 토스 디자인 시스템(TDS)의 Tabbar 컴포넌트 가이드입니다. 하단 탭바 구성 및 사용법을 확인하세요.
- [Text](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/UI/Text.md): Bedrock 프레임워크 레퍼런스 문서입니다.
- [Text](https://developers-apps-in-toss.toss.im/design/components/text.md): 토스 디자인 시스템(TDS)의 Text 컴포넌트 가이드입니다. 텍스트 스타일 및 타이포그래피 사용법을 확인하세요.
- [Top](https://developers-apps-in-toss.toss.im/design/components/top.md): 토스 디자인 시스템(TDS)의 Top 컴포넌트 가이드입니다. 상단 영역 구성 및 사용법을 확인하세요.
- [Untitled](https://developers-apps-in-toss.toss.im/bedrock/overview.md)
- [Untitled](https://developers-apps-in-toss.toss.im/checklist/_app-nongame-choice.md): 비게임 미니앱 출시 전 필수 체크리스트입니다. 내비게이션 바, 토스 로그인, 결제, 디자인 가이드 등 출시 검토 통과를 위한 상세 가이드를 확인하세요.
- [Untitled](https://developers-apps-in-toss.toss.im/checklist/_app-game-choice.md): 게임 미니앱 출시 전 필수 체크리스트입니다. 내비게이션 바, 사운드, 등급 표기, 디자인 가이드 준수 등 출시 검토 통과를 위한 상세 가이드를 확인하세요.
- [Untitled](https://developers-apps-in-toss.toss.im/checklist/_app-game-must.md): 게임 미니앱 출시 전 필수 체크리스트입니다. 내비게이션 바, 사운드, 등급 표기, 디자인 가이드 준수 등 출시 검토 통과를 위한 상세 가이드를 확인하세요.
- [Untitled](https://developers-apps-in-toss.toss.im/checklist/_app-nongame-must.md): 비게임 미니앱 출시 전 필수 체크리스트입니다. 내비게이션 바, 토스 로그인, 결제, 디자인 가이드 등 출시 검토 통과를 위한 상세 가이드를 확인하세요.
- [Untitled](https://developers-apps-in-toss.toss.im/intro/_caution-aichat.md)
- [Untitled](https://developers-apps-in-toss.toss.im/intro/_caution-chat.md): 앱인토스의 채팅 서비스 주의사항입니다. 지인 또는 ID 기반으로 특정 사용자와 메시지를 주고받는 채팅 서비스를 앱인토스 미니앱으로 제공할 경우, 이용자 보호와 불법 행위 방지를 위해 가이드를 참고해 기준을 반드시 지켜주세요.
- [Untitled](https://developers-apps-in-toss.toss.im/intro/_caution-politics.md): 앱인토스의 정치 서비스 운영 주의사항입니다. 정치 정보 제공 시 중립성과 사실 전달을 최우선으로 고려하고, 참여 유도나 판단을 유도하는 기능 없이 운영 기준을 준수해 주세요.
- [Untitled](https://developers-apps-in-toss.toss.im/intro/_caution-sensitive.md): 앱인토스의 민감 콘텐츠 주의사항입니다. 앱인토스는 성인 사용자의 다양한 콘텐츠 이용을 지원해요. 불법·유해 콘텐츠를 예방하고 토스의 신뢰성과 브랜드 가치를 지키기 위해 민감 콘텐츠 주의사항을 확인하세요.
- [Untitled](https://developers-apps-in-toss.toss.im/intro/_caution-web-board.md): 앱인토스의 웹보드 게임 서비스 출시 주의사항입니다. 게임물 등급분류, 사행성 방지, 청소년 보호, 과몰입 방지 등 법적 규제 준수 요건과 운영 정책을 확인하세요.
- [Untitled](https://developers-apps-in-toss.toss.im/intro/_caution-social.md): 앱인토스의 데이팅, 만남, 소셜 서비스 운영 주의사항입니다. 법적 규제 준수, 청소년 보호, 개인정보 보호, 안전 관리 및 모니터링 요구사항을 확인하세요.
- [Untitled](https://developers-apps-in-toss.toss.im/markdown-examples.md)
- [Untitled](https://developers-apps-in-toss.toss.im/unity/optimization/runtime/memory-profiling.md)
- [View](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/UI/View.md): Bedrock 프레임워크 레퍼런스 문서입니다.
- [Vite로 Unity WebGL 빌드 감싸기](https://developers-apps-in-toss.toss.im/unity/porting-tutorials/vite-unity.md): Vite와 Unity를 활용한 앱인토스 미니앱 개발 가이드입니다. Vite 기반 프로젝트에서 Unity WebGL을 통합하는 방법을 확인하세요.
- [값 삭제하기](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/저장소/removeItem.md)
- [값 읽기](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/저장소/getItem.md)
- [값 저장하기](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/저장소/setItem.md)
- [개발 서버 연결하기](https://developers-apps-in-toss.toss.im/development/local-server.md): 앱인토스 개발 서버를 연결하는 방법을 안내합니다. Metro 서버 실행, iOS/Android 시뮬레이터 및 실기기에서 로컬 서버 연결 방법을 확인하세요.
- [결제 결과 반환](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/토스페이/CheckoutPaymentResult.md)
- [결제 옵션](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/토스페이/CheckoutPaymentOptions.md)
- [결제 인증 실행하기](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/토스페이/checkoutPayment.md)
- [결제하기](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/인앱 결제/createOneTimePurchaseOrder.md)
- [공유 완료 리워드 정보 이벤트](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/친구초대/RewardFromContactsViralEvent.md)
- [광고 공통 이벤트 타입](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/광고/AdMobFullScreenEvent.md)
- [광고 네트워크 응답 객체](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/광고/AdNetworkResponseInfo.md)
- [광고 로드 응답 객체](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/광고/ResponseInfo.md)
- [광고 보여주기](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/광고/showAdMobInterstitialAd.md)
- [광고 보여주기](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/광고/showAdMobRewardedAd.md)
- [광고 불러오기](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/광고/loadAdMobRewardedAd.md)
- [광고 옵션 객체](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/광고/LoadAdMobOptions.md)
- [광고 옵션 객체](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/광고/ShowAdMobParams.md)
- [광고 이벤트 타입](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/광고/LoadAdMobEvent.md)
- [광고 이벤트 타입](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/광고/ShowAdMobEvent.md)
- [대기 중인 목록 가져오기](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/인앱 결제/getPendingOrders.md)
- [모든 항목 삭제](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/저장소/clearItems.md)
- [보상형 광고 로드 응답 객체](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/광고/RewardedAd.md)
- [보상형 광고 옵션 객체](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/광고/LoadAdMobRewardedAdParams.md)
- [보상형 광고 옵션 객체](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/광고/ShowAdMobRewardedAdParams.md)
- [보상형 광고 이벤트 타입](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/광고/LoadAdMobRewardedAdEvent.md)
- [보상형 광고 이벤트 타입](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/광고/ShowAdMobRewardedAdEvent.md)
- [본인확인 결과 조회](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/인증/tosscertResult.md)
- [본인확인 상태 조회](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/인증/tosscertStatus.md)
- [상품 지급하기](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/인앱 결제/completeProductGrant.md)
- [상품목록 가져오기](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/인앱 결제/getProductItemList.md)
- [액세스 토큰 발급](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/인증/tosscertAccessToken.md)
- [예제 코드 모음](https://developers-apps-in-toss.toss.im/tutorials/examples.md): 앱인토스 미니앱 개발을 위한 실전 예제 코드 모음입니다. Vue, React, jQuery 등 다양한 프레임워크로 구현된 완성형 미니앱 예제부터 카메라, 위치 정보, 광고, 인앱 결제, 로그인, 공유 등 주요 네이티브 기능을 활용하는 방법까지 포함합니다.
- [오버레이 생성·관리하기](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/overlay/useOverlayBase.md)
- [인앱 광고 공통 타입·객체](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/광고/GoogleAdMob.md)
- [인앱 광고(v1.0)](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/광고/loadAdMobInterstitialAd.md)
- [자동결제 개발하기](https://developers-apps-in-toss.toss.im/tosspay/auto-pay.md): 토스페이 자동결제(정기결제) 개발 가이드예요. 빌링키 생성부터 결제 승인, 해지까지 전체 플로우를 안내해요.
- [자사 앱 설치/외부 링크 가이드라인](https://developers-apps-in-toss.toss.im/checklist/miniapp-external-link.md): 앱인토스 미니앱의 자사 앱 설치 유도 및 외부 링크 이동 제한 정책입니다. 제한되는 행위, 허용되는 경우, 위반 시 조치 사항을 확인하세요.
- [전면 광고 로드 응답 객체](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/광고/InterstitialAd.md)
- [전면 광고 옵션 객체](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/광고/LoadAdMobInterstitialAdParams.md)
- [전면 광고 옵션 객체](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/광고/ShowAdMobInterstitialAdParams.md)
- [전면 광고 이벤트 타입](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/광고/LoadAdMobInterstitialAdEvent.md)
- [전면 광고 이벤트 타입](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/광고/ShowAdMobInterstitialAdEvent.md)
- [주문목록 가져오기](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/인앱 결제/getCompletedOrRefundedOrders.md)
- [진동 타입(옵션)](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/인터렉션/HapticFeedbackOptions.md)
- [친구 초대 옵션](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/친구초대/ContactsViralOption.md)
- [친구 초대 완료 반환 이벤트](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/친구초대/ContactsViralSuccessEvent.md)
- [친구 초대 파라미터](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/친구초대/ContactsViralParams.md)
- [쿼리 파라미터 사용하기](https://developers-apps-in-toss.toss.im/learn-more/query-parameter-deprecated.md): 앱인토스 미니앱의 쿼리 파라미터 사용 가이드 (Deprecated)입니다.
- [토스 인증](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/인증/tosscert.md): Bedrock 프레임워크 레퍼런스 문서입니다.
- [파트너사 로그인 연동하기](https://developers-apps-in-toss.toss.im/login/store-login.md)
- [햅틱 진동 실행하기](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/인터렉션/generateHapticFeedback.md)
- [화면 이동하기](https://developers-apps-in-toss.toss.im/development/routing-deprecated.md): Bedrock 애플리케이션의 화면 이동 및 라우팅 가이드 (Deprecated). 최신 문서는 Bedrock 레퍼런스를 참고하세요.
