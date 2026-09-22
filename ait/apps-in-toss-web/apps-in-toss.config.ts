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
    primaryColor: '#F4D03F'
  },

  webView: {
    // 이 키가 빠지면 토스 웹뷰에서 Godot wasm 이 instantiate 되지 않고 스플래시에서
    // 멈춘다. engine.init() 이 resolve 도 reject 도 하지 않는다. SDK 3.x 타입에는
    // 없지만 CLI 가 bundle.json 에 그대로 실어 플랫폼까지 전달한다.
    // ait migrate v3 가 이 키를 지우므로 검사기(check-ait-brand-contract.mjs)가 못 박는다.
    // seorilabs/lucid-chess 가 이것 때문에 커밋 8개를 태웠다.
    type: 'game',
    bounces: false,
    pullToRefreshEnabled: false,
    overScrollMode: 'never',
    allowsBackForwardNavigationGestures: false
  },

  // 진행은 기기 로컬 저장이라 외부 권한을 요청하지 않는다.
  permissions: [],

  webBundleDir: 'dist'
})
