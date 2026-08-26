import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { I18nContext } from "../i18n/i18nContext";
import { translate } from "../i18n/i18n";
import type { Locale } from "../i18n/messages";
import type { SubmissionBlockReason } from "../game/submission";
import { ResultModal } from "./ResultModal";

type Overrides = Partial<Parameters<typeof ResultModal>[0]>;

function renderResult(locale: Locale, overrides: Overrides = {}): string {
  return renderToStaticMarkup(
    <I18nContext.Provider
      value={{
        locale,
        setLocale: () => undefined,
        t: (key, params) => translate(locale, key, params),
      }}
    >
      <ResultModal
        open
        seconds={12.3}
        mode="classic"
        previousBestSeconds={null}
        isNewBest={false}
        challengeTargetSeconds={null}
        earnedCoins={43}
        maxCombo={7}
        comboBonusCoins={15}
        correctCount={10}
        wrongCount={2}
        earnedDroplets={1}
        submissionBlockReason={null}
        stageId={null}
        stageStars={0}
        hasNextStage={false}
        onNextStage={() => undefined}
        dailyClearedToday
        onPlayDaily={() => undefined}
        onRetry={() => undefined}
        shareStatus="idle"
        onShare={() => undefined}
        onPlayClassic={() => undefined}
        leaderboardEnabled={false}
        leaderboardScore={null}
        leaderboardSubmitStatus="idle"
        leaderboardStatus="idle"
        leaderboardMessage={null}
        onOpenLeaderboard={() => undefined}
        onExit={() => undefined}
        {...overrides}
      />
    </I18nContext.Provider>,
  );
}

describe("ResultModal 콤보 보상", () => {
  it("한국어 결과에 최대 콤보와 보너스 코인을 표시한다", () => {
    expect(renderResult("ko")).toContain("최대 콤보 x7 🪙 +15");
  });

  it("영어 결과에도 같은 값을 표시한다", () => {
    expect(renderResult("en")).toContain("Max combo x7 🪙 +15");
  });
});

describe("ResultModal 정확도", () => {
  it("오답이 있으면 정확도와 오답 수를 보여준다", () => {
    const markup = renderResult("ko");
    expect(markup).toContain("정확도 83%");
    expect(markup).toContain("오답 2회");
  });

  it("무오답 클리어는 PERFECT를 강조한다", () => {
    const markup = renderResult("ko", { wrongCount: 0 });
    expect(markup).toContain("무오답 클리어!");
    expect(markup).toContain("is-perfect");
  });

  it("획득한 물방울을 보여준다", () => {
    expect(renderResult("ko")).toContain("물방울 💧 +1");
  });
});

describe("ResultModal i18n 버튼", () => {
  it("한국어 로케일에서 버튼 문구가 한국어로 나온다", () => {
    const markup = renderResult("ko");
    expect(markup).toContain("다시 하기");
    expect(markup).toContain("나가기");
    expect(markup).toContain("공유하기");
    expect(markup).not.toContain(">RETRY<");
  });

  it("영어 로케일에서는 기존 레트로 표기를 유지한다", () => {
    const markup = renderResult("en");
    expect(markup).toContain("RETRY");
    expect(markup).toContain("EXIT");
    expect(markup).toContain("SHARE");
  });
});

describe("ResultModal 미제출 안내", () => {
  const cases: Array<[SubmissionBlockReason, string]> = [
    ["daily-retry", "연습 기록"],
    ["power-up-used", "파워업을 사용한 판"],
    ["archived-daily", "지난 도전 기록"],
  ];

  for (const [reason, expected] of cases) {
    it(`${reason}이면 안내를 노출한다`, () => {
      expect(renderResult("ko", { submissionBlockReason: reason })).toContain(
        expected,
      );
    });
  }

  it("제출한 판에는 안내를 노출하지 않는다", () => {
    expect(renderResult("ko")).not.toContain("연습 기록");
  });
});

describe("ResultModal 스테이지 결과", () => {
  it("별점과 다음 스테이지 버튼을 보여준다", () => {
    const markup = renderResult("ko", {
      mode: "stage",
      stageId: 3,
      stageStars: 2,
      hasNextStage: true,
    });
    expect(markup).toContain("스테이지 3");
    expect(markup).toContain("별 2/3");
    expect(markup).toContain("다음 스테이지");
  });
});

describe("ResultModal 데일리 카운트다운", () => {
  it("데일리 결과에 다음 도전까지 남은 시간을 노출한다", () => {
    expect(renderResult("ko", { mode: "daily" })).toContain("다음 도전까지");
  });

  it("오늘 데일리를 이미 깬 클래식 결과에도 카운트다운을 노출한다", () => {
    expect(renderResult("ko", { dailyClearedToday: true })).toContain(
      "다음 도전까지",
    );
  });
});
