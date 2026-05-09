import { useEffect } from "react";

import { setScreenAwakeMode } from "@apps-in-toss/web-framework";

/**
 * 게임 화면이 마운트되어 있는 동안 디바이스 화면이 꺼지지 않도록 설정합니다.
 * 언마운트나 페이지 가시성 변경 시 안전 측에 두기 위해 다시 끔 호출을 보냅니다.
 *
 * `setScreenAwakeMode`는 Apps in Toss 환경에서만 정상 동작하므로, 호출 자체를
 * try/catch로 감싸 일반 브라우저에서도 에러가 발생하지 않도록 합니다.
 */
export function useScreenAwake(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    (async () => {
      try {
        await setScreenAwakeMode({ enabled: true });
      } catch {
        // Apps in Toss 환경이 아니면 무시합니다.
      }
    })();
    return () => {
      (async () => {
        try {
          await setScreenAwakeMode({ enabled: false });
        } catch {
          // 무시
        }
      })();
    };
  }, [active]);
}
