/**
 * Platform 세션 교환 로직(순수). 주입한 의존성만 사용하므로 SDK/Firebase 없이 테스트할 수 있다.
 *
 * 흐름: Platform custom token bridge → Firebase 로그인 → Firebase ID token → Platform 세션.
 * 자체 익명 로그인을 새로 만들지 않고 bridge가 주는 신원을 그대로 쓴다.
 * 어떤 단계가 실패해도 예외를 밖으로 내보내지 않는다 — 세션 실패가 게임을 막으면 안 된다.
 */

export interface FirebaseCustomTokenBootstrap {
  firebaseCustomToken: string;
  appUserId: string;
}

export interface PlatformSessionDeps {
  /** 이미 로그인된 Firebase 사용자의 ID token(없으면 null). uid 재사용의 근거가 된다. */
  getExistingIdToken: () => Promise<string | null>;
  /** Platform bootstrap 호출. 기존 ID token을 주면 같은 사용자로 이어진다. */
  requestCustomToken: (
    existingIdToken?: string,
  ) => Promise<FirebaseCustomTokenBootstrap>;
  /** custom token으로 Firebase에 로그인하고 새 ID token을 받는다. */
  signInWithCustomToken: (customToken: string) => Promise<string>;
  /** ID token으로 Platform 세션을 연다. */
  openSession: (idToken: string) => Promise<void>;
}

export type PlatformSessionFailure =
  | "custom-token-failed"
  | "firebase-sign-in-failed"
  | "session-failed";

export type PlatformSessionResult =
  | { ok: true; appUserId: string; reusedExistingUser: boolean }
  | { ok: false; reason: PlatformSessionFailure };

/**
 * 세션을 한 번 연다.
 *
 * 반환값에 custom token이나 ID token을 담지 않는다(로그·저장 유출 방지).
 */
export async function openPlatformSession(
  deps: PlatformSessionDeps,
): Promise<PlatformSessionResult> {
  let existingIdToken: string | null = null;
  try {
    existingIdToken = await deps.getExistingIdToken();
  } catch {
    // 기존 사용자를 못 읽어도 새 신원으로 계속 진행한다.
    existingIdToken = null;
  }

  let bootstrap: FirebaseCustomTokenBootstrap;
  try {
    bootstrap = await deps.requestCustomToken(existingIdToken ?? undefined);
  } catch {
    return { ok: false, reason: "custom-token-failed" };
  }

  let idToken: string;
  try {
    idToken = await deps.signInWithCustomToken(bootstrap.firebaseCustomToken);
  } catch {
    return { ok: false, reason: "firebase-sign-in-failed" };
  }

  try {
    await deps.openSession(idToken);
  } catch {
    return { ok: false, reason: "session-failed" };
  }

  return {
    ok: true,
    appUserId: bootstrap.appUserId,
    reusedExistingUser: existingIdToken !== null,
  };
}
