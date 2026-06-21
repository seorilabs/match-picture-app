import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { installErrorReporter } from "./firebase/errorReporter";

// 미처리 JS 에러를 Analytics로 보고(네이티브 Crashlytics 추가 전까지 3타겟 공통).
installErrorReporter();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
