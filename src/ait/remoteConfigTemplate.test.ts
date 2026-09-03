import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { getDefaultLaunchConfig, type LaunchConfig } from "./launchConfig";

/**
 * `remoteconfig.template.json`은 Firebase Remote Config에 실제로 배포되는 정본이고,
 * `DEFAULT_LAUNCH_CONFIG`는 RC를 읽지 못했을 때 쓰는 클라이언트 fallback이다.
 * 둘이 어긋나면 RC를 받은 사용자와 못 받은 사용자가 다른 규칙으로 게임하게 되므로
 * (특히 전면 광고 빈도 캡) 파라미터 집합과 기본값을 함께 고정한다.
 */
interface RemoteConfigTemplate {
  parameters: Record<
    string,
    { defaultValue?: { value?: string }; valueType?: string }
  >;
}

const template = JSON.parse(
  readFileSync(new URL("../../remoteconfig.template.json", import.meta.url), {
    encoding: "utf8",
  }),
) as RemoteConfigTemplate;

function templateValue(key: string): boolean | number {
  const parameter = template.parameters[key];
  const raw = parameter?.defaultValue?.value;
  if (raw === undefined) {
    throw new Error(`remoteconfig.template.json에 ${key} 기본값이 없다`);
  }
  if (parameter?.valueType === "BOOLEAN") return raw === "true";
  if (parameter?.valueType === "NUMBER") return Number(raw);
  throw new Error(`${key}의 valueType(${parameter?.valueType})을 다루지 않는다`);
}

describe("remoteconfig.template.json", () => {
  const defaults = getDefaultLaunchConfig();

  it("covers exactly the LaunchConfig keys the client reads", () => {
    expect(Object.keys(template.parameters).sort()).toEqual(
      Object.keys(defaults).sort(),
    );
  });

  it.each(Object.keys(getDefaultLaunchConfig()) as (keyof LaunchConfig)[])(
    "keeps %s in sync with the client fallback",
    (key) => {
      expect(templateValue(key)).toBe(defaults[key]);
    },
  );
});
