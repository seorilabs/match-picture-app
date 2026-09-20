import { defineConfig } from '@apps-in-toss/web-framework/config'

// 앱인토스 래퍼 설정.
// Godot Web export(정적 HTML/JS/WASM)를 감싸 `ait build` 로 .ait 아티팩트를 만든다.
//
// displayName 과 icon 은 환경변수가 아니라 리터럴로 둔다. 중앙 재사용 워크플로
// godot-deploy-ait.yml 은 `npm run build` 만 실행하고 그 두 값을 주입하지 않으므로,
// 환경변수에 기대면 릴리스 빌드가 반드시 실패한다. 둘 다 콘솔에 등록된 공개 정보다.
export default defineConfig({
  // 앱인토스 콘솔에 등록된 앱 식별자. 바꾸면 기존 등록을 잃는다.
  appName: 'match-picture-app',
  brand: {
    // 콘솔 등록명. Android/iOS 표시명 '같은그림찾기'(붙여쓰기)와 다르다.
    displayName: '같은 그림 찾기',
    primaryColor: '#F4D03F',
    // 콘솔에 등록·승인된 600x600 아이콘과 같은 URL.
    icon: 'https://static.toss.im/appsintoss/38345/eb5bfd71-a58c-4952-b20c-49815186e1f7.png',
  },
  web: {
    host: 'localhost',
    port: 5173,
    commands: {
      dev: 'npm run dev:web',
      build: 'npm run build:web',
    },
  },
  webViewProps: {
    // 게임이므로 당겨서 새로고침과 바운스를 모두 끈다. 카드를 누르려다 화면이
    // 끌려가면 오답이 된다.
    type: 'game',
    bounces: false,
    pullToRefreshEnabled: false,
    overScrollMode: 'never',
    allowsBackForwardNavigationGestures: false,
  },
  // 진행은 기기 로컬 저장이라 외부 권한을 요청하지 않는다.
  permissions: [],
  outdir: 'dist',
})
