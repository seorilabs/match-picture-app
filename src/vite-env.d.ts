/// <reference types="vite/client" />

/** package.json version을 빌드타임에 주입한다(vite.config.ts define). */
declare const __APP_VERSION__: string;

declare module "*.css" {
  const content: Record<string, string>;
  export default content;
}
