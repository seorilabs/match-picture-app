import { Component, type ErrorInfo, type ReactNode } from "react";

import { trackEvent } from "../firebase/analytics";
import { t } from "../i18n/i18n";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/** i18n Provider 바깥에서도 동작해야 하므로 사전 조회 실패 시 기본 문구로 폴백한다. */
function safeText(key: string, fallback: string): string {
  try {
    const value = t(key);
    return value === key ? fallback : value;
  } catch {
    return fallback;
  }
}

function reload(): void {
  try {
    window.location.reload();
  } catch {
    // 새로고침을 막는 환경에서도 폴백 UI는 그대로 남는다.
  }
}

/**
 * 루트 에러 경계.
 *
 * 렌더 중 예외가 나면 React가 트리를 통째로 언마운트해 흰 화면만 남는다.
 * 토스 웹뷰에는 새로고침 수단이 없으므로 복구 버튼이 있는 폴백을 반드시 띄운다.
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    void trackEvent("react_render_error", {
      message: String(error?.message ?? error).slice(0, 200),
      component_stack: String(info?.componentStack ?? "").slice(0, 300),
    });
  }

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="error-fallback" role="alert">
        <h1 className="error-fallback-title">
          {safeText("error.title", "문제가 생겼어요")}
        </h1>
        <p className="error-fallback-body">
          {safeText(
            "error.body",
            "잠시 문제가 생겨 화면을 그리지 못했어요. 코인·정원·미션 기록은 그대로 저장되어 있어요.",
          )}
        </p>
        <button type="button" className="primary-button" onClick={reload}>
          {safeText("error.retry", "다시 시작")}
        </button>
      </div>
    );
  }
}
