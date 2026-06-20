import { getApps, initializeApp, type FirebaseApp } from "firebase/app";

import { firebaseConfig } from "./config";

let cached: FirebaseApp | null = null;

/**
 * Firebase 앱을 지연 초기화한다. window가 없거나 초기화에 실패하면 null을 반환해
 * (토스/Capacitor/브라우저 어디서든) 앱 흐름을 막지 않는다.
 */
export function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === "undefined") return null;
  if (cached) return cached;
  try {
    cached = getApps()[0] ?? initializeApp(firebaseConfig);
    return cached;
  } catch {
    return null;
  }
}
