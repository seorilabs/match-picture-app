/**
 * Firebase Web 앱 설정.
 *
 * 여기 값들은 Firebase Web 앱의 "공개 식별자"라 클라이언트 번들에 포함돼도 안전하다.
 * (보안은 API 키 은닉이 아니라 Security Rules / App Check로 한다.)
 * 환경변수로 override 가능하지만, 미설정 시 아래 기본값으로 동작한다.
 */
/**
 * override가 "설정된 값"일 때만 채택한다.
 *
 * `??`만 쓰면 빈 문자열이 기본값을 덮는다. org 재사용 배포 워크플로우는 저장소에
 * Firebase Variable이 없으면 `VITE_FIREBASE_*`를 빈 문자열로 넘기므로, 그대로 두면
 * 배포 빌드의 Firebase 설정이 통째로 비어 Analytics/Remote Config/인증이 모두 죽는다.
 */
export function envOverride(
  value: string | undefined,
  fallback: string,
): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

export const firebaseConfig = {
  apiKey: envOverride(
    import.meta.env.VITE_FIREBASE_API_KEY,
    "AIzaSyAlRAliXNx2ep3lP1F-GFLpU-s4VBs8I6E",
  ),
  authDomain: envOverride(
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    "match-picture-app.firebaseapp.com",
  ),
  projectId: envOverride(
    import.meta.env.VITE_FIREBASE_PROJECT_ID,
    "match-picture-app",
  ),
  storageBucket: envOverride(
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    "match-picture-app.firebasestorage.app",
  ),
  messagingSenderId: envOverride(
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    "694776397541",
  ),
  appId: envOverride(
    import.meta.env.VITE_FIREBASE_APP_ID,
    "1:694776397541:web:e3a0a276e8487f66861e0c",
  ),
  // Google Analytics(GA4) 측정 ID. 비어 있으면 Analytics는 비활성(no-op).
  measurementId: envOverride(
    import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
    "G-L5GMV0NX7C",
  ),
};
