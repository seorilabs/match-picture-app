import { describe, expect, it } from "vitest";

import { messages } from "./messages";
import { isSupportedLocale, setLocale, t, translate } from "./i18n";

describe("translate / t", () => {
  it("로케일별 문자열을 반환한다", () => {
    expect(translate("ko", "tab.home")).toBe("홈");
    expect(translate("en", "tab.home")).toBe("Home");
  });

  it("{param}를 보간한다", () => {
    expect(translate("en", "home.dex", { n: 2, m: 6 })).toBe("Collection 2/6");
    expect(translate("ko", "home.waterMore", { n: 3 })).toBe("물 3번 더");
  });

  it("키가 없으면 기본 로케일 → 키 순으로 fallback한다", () => {
    expect(translate("ko", "___missing___")).toBe("___missing___");
  });

  it("setLocale 후 t가 해당 로케일을 쓴다", () => {
    setLocale("en");
    expect(t("tab.shop")).toBe("Shop");
    setLocale("ko");
    expect(t("tab.shop")).toBe("상점");
  });
});

describe("isSupportedLocale", () => {
  it("지원 로케일만 통과", () => {
    expect(isSupportedLocale("ko")).toBe(true);
    expect(isSupportedLocale("en")).toBe(true);
    expect(isSupportedLocale("fr")).toBe(false);
    expect(isSupportedLocale(null)).toBe(false);
  });
});

describe("사전 정합성", () => {
  it("ko와 en의 키 집합이 동일하다", () => {
    const koKeys = Object.keys(messages.ko).sort();
    const enKeys = Object.keys(messages.en).sort();
    expect(enKeys).toEqual(koKeys);
  });
});
