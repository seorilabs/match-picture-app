/**
 * Platform 인증 단일 진입점.
 *
 * Capacitor(Play/App Store)와 Granite(AIT), 브라우저가 모두 이 경로 하나를 탄다.
 * Firebase Auth가 uid를 저장소에 보존하므로 재실행 시 같은 uid가 이어지고,
 * 저장소를 못 쓰는 웹뷰에서는 bootstrap이 새 신원을 발급한다(플레이는 그대로 진행).
 *
 * custom token과 ID token은 이 모듈 밖으로 나가지 않는다(저장·로그 금지).
 */
import { createPlatform, type Platform } from "@seorilabs/platform-sdk";
import {
  getAuth,
  signInWithCustomToken as firebaseSignInWithCustomToken,
  type Auth,
} from "firebase/auth";

import { getFirebaseApp } from "./app";
import { trackEvent } from "./analytics";
import { PLATFORM_API_URL, PLATFORM_APP_ID } from "../platform/config";
import {
  openPlatformSession,
  type PlatformSessionResult,
} from "../platform/session";

let platform: Platform | null = null;
let sessionPromise: Promise<PlatformSessionResult> | null = null;

function getPlatform(): Platform | null {
  if (platform) return platform;
  try {
    platform = createPlatform({
      appId: PLATFORM_APP_ID,
      baseUrl: PLATFORM_API_URL,
    });
    return platform;
  } catch {
    return null;
  }
}

function getFirebaseAuth(): Auth | null {
  const app = getFirebaseApp();
  if (app === null) return null;
  try {
    return getAuth(app);
  } catch {
    return null;
  }
}

/**
 * 앱 실행당 한 번만 Platform 세션을 연다.
 * 실패해도 예외를 던지지 않으며, 다음 실행에서 다시 시도한다.
 */
export function ensurePlatformSession(): Promise<PlatformSessionResult> {
  if (sessionPromise) return sessionPromise;

  sessionPromise = (async (): Promise<PlatformSessionResult> => {
    const client = getPlatform();
    const auth = getFirebaseAuth();
    if (client === null || auth === null) {
      return { ok: false, reason: "session-failed" };
    }

    const result = await openPlatformSession({
      getExistingIdToken: async () => {
        const user = auth.currentUser;
        if (user === null) return null;
        return user.getIdToken();
      },
      requestCustomToken: (existingIdToken) =>
        client.identity.firebaseCustomToken(existingIdToken),
      signInWithCustomToken: async (customToken) => {
        const credential = await firebaseSignInWithCustomToken(
          auth,
          customToken,
        );
        return credential.user.getIdToken();
      },
      openSession: async (idToken) => {
        await client.signIn({ kind: "firebase-id-token", value: idToken });
      },
    });

    // 토큰 값은 남기지 않고 성공/실패 사유만 기록한다.
    void trackEvent("platform_session", {
      ok: result.ok,
      reason: result.ok ? "ok" : result.reason,
    });
    return result;
  })();

  return sessionPromise;
}

/** 테스트 전용: 세션 캐시를 비운다. */
export function resetPlatformSessionForTest(): void {
  platform = null;
  sessionPromise = null;
}
