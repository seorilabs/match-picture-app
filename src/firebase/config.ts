/**
 * Firebase Web 앱 설정.
 *
 * 여기 값들은 Firebase Web 앱의 "공개 식별자"라 클라이언트 번들에 포함돼도 안전하다.
 * (보안은 API 키 은닉이 아니라 Security Rules / App Check로 한다.)
 * 환경변수로 override 가능하지만, 미설정 시 아래 기본값으로 동작한다.
 */
export const firebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY ??
    "AIzaSyAlRAliXNx2ep3lP1F-GFLpU-s4VBs8I6E",
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ??
    "match-picture-app.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "match-picture-app",
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ??
    "match-picture-app.firebasestorage.app",
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "694776397541",
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ??
    "1:694776397541:web:e3a0a276e8487f66861e0c",
};
