/**
 * Presence heartbeat 러너.
 *
 * SDK의 `Platform.presence`를 감싸 lifecycle(시작·정지·복귀)만 연결한다.
 * 이 경로는 제품 기능이 아니라 관측이므로, 어떤 실패도 호출자에게 전파하지 않고
 * await하지도 않는다. outbox·재전송 큐·로컬 저장은 두지 않는다(SDK 계약 그대로).
 */

export interface PresenceRunner {
  start: () => void;
  stop: () => void;
  resume: () => void;
}

/** SDK `Presence`에서 실제로 쓰는 부분만 좁힌 계약. 테스트에서 대역을 넣기 쉽다. */
export interface PresenceLike {
  start: () => void;
  stop: () => void;
  resume: () => void;
}

export interface CreatePresenceRunnerOptions {
  enabled: boolean;
  /** 비활성일 때는 호출조차 하지 않도록 지연 조회한다. */
  getPresence: () => PresenceLike | null;
}

const NOOP_RUNNER: PresenceRunner = {
  start: () => undefined,
  stop: () => undefined,
  resume: () => undefined,
};

function guard(run: () => void): void {
  try {
    run();
  } catch {
    // Edge 장애·브릿지 부재 등 어떤 실패도 제품 흐름으로 새어 나가지 않는다.
  }
}

export function createPresenceRunner({
  enabled,
  getPresence,
}: CreatePresenceRunnerOptions): PresenceRunner {
  if (!enabled) return NOOP_RUNNER;

  const call = (pick: (presence: PresenceLike) => void) => {
    guard(() => {
      const presence = getPresence();
      if (presence === null) return;
      pick(presence);
    });
  };

  return {
    start: () => call((presence) => presence.start()),
    stop: () => call((presence) => presence.stop()),
    resume: () => call((presence) => presence.resume()),
  };
}
