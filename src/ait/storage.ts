import { Storage } from "@apps-in-toss/web-framework";

/**
 * Apps in Toss `Storage`를 우선 사용하되, 브라우저 개발 환경처럼 브릿지가 없는
 * 상황에서는 `localStorage`로 fallback합니다.
 *
 * Apps in Toss WebView 환경에서도 어떤 빌드에서는 브릿지 호출이 거부되어 throw할 수 있으므로
 * 모든 호출을 try/catch로 감싸 안전 측에 둡니다.
 */
function hasLocalStorage(): boolean {
  try {
    return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
  } catch {
    return false;
  }
}

export async function readItem(key: string): Promise<string | null> {
  try {
    const value = await Storage.getItem(key);
    if (value !== null && value !== undefined) return value;
  } catch {
    // fall through to localStorage
  }
  if (hasLocalStorage()) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  return null;
}

export async function writeItem(key: string, value: string): Promise<void> {
  try {
    await Storage.setItem(key, value);
    return;
  } catch {
    // fall through to localStorage
  }
  if (hasLocalStorage()) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // 무시
    }
  }
}
