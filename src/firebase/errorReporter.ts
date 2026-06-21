/**
 * 전역 JS 에러 리포터. WebView 중심 앱이라 네이티브 Crashlytics(네이티브 빌드 단계에서
 * 추가) 전까지, 미처리 JS 에러/리젝션을 Analytics 이벤트로 보내 3타겟 모두에서
 * 크래시·에러 가시성을 확보한다.
 */
import { trackEvent } from "./analytics";

let installed = false;

function clip(value: unknown, max = 120): string {
  return String(value ?? "").slice(0, max);
}

export function installErrorReporter(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;

  window.addEventListener("error", (event) => {
    void trackEvent("js_error", {
      message: clip(event.message),
      source: clip(event.filename, 160),
      line: event.lineno ?? 0,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    void trackEvent("js_unhandled_rejection", {
      reason: clip(event.reason),
    });
  });
}
