/**
 * 화면에 노출하는 앱 버전.
 *
 * 릴리스 빌드는 `VITE_APP_VERSION`을 주입하고, 그 외에는 vite가 package.json version을
 * `__APP_VERSION__`으로 넣어 준다(`vite.config.ts`의 `define`).
 */
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || __APP_VERSION__;
