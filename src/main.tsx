import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { installErrorReporter } from "./firebase/errorReporter";
import { installNativeBackButton } from "./native/backButton";
import { ensurePlatformSession } from "./firebase/auth";

// 미처리 JS 에러를 Analytics로 보고(네이티브 Crashlytics 추가 전까지 3타겟 공통).
installErrorReporter();
// Android 하드웨어 뒤로가기(네이티브 셸에서만 활성).
installNativeBackButton();
// Platform 세션은 백그라운드로 연다. 실패해도 게임 진행을 막지 않는다.
void ensurePlatformSession();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
