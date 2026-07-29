/**
 * Firebase Remote Config 어댑터. 출시 후 기능 kill-switch와 전면 광고
 * 빈도 캡을 읽는다. (기존 vzyx JSON을 대체)
 *
 * 어떤 환경(토스/Capacitor/브라우저)에서도 RC가 지원되지 않거나 실패하면 null을
 * 반환해 호출부가 기본값으로 떨어지게 한다.
 */
import {
  fetchAndActivate,
  getRemoteConfig,
  getValue,
  isSupported,
  type RemoteConfig,
} from "firebase/remote-config";

import { getFirebaseApp } from "./app";

/** LaunchConfig와 구조가 동일한 RC 플래그 묶음(순환참조 방지를 위해 별도 선언). */
export interface RemoteFlags {
  leaderboardEnabled: boolean;
  reviewRequestEnabled: boolean;
  interstitialAdEnabled: boolean;
  interstitialMinIntervalSeconds: number;
  interstitialFreeGames: number;
}

const BOOLEAN_FLAG_KEYS = [
  "leaderboardEnabled",
  "reviewRequestEnabled",
  "interstitialAdEnabled",
] as const satisfies readonly (keyof RemoteFlags)[];

const NUMBER_FLAG_KEYS = [
  "interstitialMinIntervalSeconds",
  "interstitialFreeGames",
] as const satisfies readonly (keyof RemoteFlags)[];

let rcPromise: Promise<RemoteConfig | null> | null = null;

async function getRC(defaults: RemoteFlags): Promise<RemoteConfig | null> {
  if (rcPromise) return rcPromise;
  rcPromise = (async () => {
    try {
      if (!(await isSupported())) return null;
      const app = getFirebaseApp();
      if (!app) return null;
      const rc = getRemoteConfig(app);
      rc.defaultConfig = { ...defaults };
      // kill-switch라 빠른 전파가 중요 → 1시간(기본 12h 대신).
      rc.settings.minimumFetchIntervalMillis = 60 * 60 * 1000;
      rc.settings.fetchTimeoutMillis = 5000;
      return rc;
    } catch {
      return null;
    }
  })();
  return rcPromise;
}

function readFlags(rc: RemoteConfig): RemoteFlags {
  const result = {} as RemoteFlags;
  for (const key of BOOLEAN_FLAG_KEYS) {
    result[key] = getValue(rc, key).asBoolean();
  }
  for (const key of NUMBER_FLAG_KEYS) {
    result[key] = getValue(rc, key).asNumber();
  }
  return result;
}

/** 네트워크 없이 마지막 활성값(또는 기본값)을 즉시 읽는다. */
export async function readRemoteFlags(
  defaults: RemoteFlags,
): Promise<RemoteFlags | null> {
  const rc = await getRC(defaults);
  if (!rc) return null;
  try {
    return readFlags(rc);
  } catch {
    return null;
  }
}

/** 서버에서 최신값을 받아 활성화한 뒤 읽는다. 실패하면 현재값으로 폴백. */
export async function refreshRemoteFlags(
  defaults: RemoteFlags,
): Promise<RemoteFlags | null> {
  const rc = await getRC(defaults);
  if (!rc) return null;
  try {
    await fetchAndActivate(rc);
    return readFlags(rc);
  } catch {
    try {
      return readFlags(rc);
    } catch {
      return null;
    }
  }
}
