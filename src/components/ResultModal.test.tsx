import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { I18nContext } from "../i18n/i18nContext";
import { translate } from "../i18n/i18n";
import type { Locale } from "../i18n/messages";
import { ResultModal } from "./ResultModal";

function renderResult(locale: Locale): string {
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
      />
    </I18nContext.Provider>,
  );
}

describe("ResultModal 콤보 보상", () => {
  it("한국어 결과에 최대 콤보와 보너스 코인을 표시한다", () => {
    expect(renderResult("ko")).toContain("최대 콤보 x7 🪙 +15");
  });

  it("영어 결과에 최대 콤보와 보너스 코인을 표시한다", () => {
    expect(renderResult("en")).toContain("Max combo x7 🪙 +15");
  });
});
