import assert from "node:assert/strict";
import test from "node:test";
import {resolveVersion} from "./resolve-release-version.mjs";

test("Play 운영 1.0.11 다음 patch를 통합 빌드 번호로 변환한다", () => {
  assert.deepEqual(resolveVersion("v1.0.12"), {
    version_name: "1.0.12",
    android_version_code: "1000012",
    apple_marketing_version: "1.0.12",
    apple_build_number: "1000012",
    release_name: "1.0.12",
  });
});

test("2자리·NaN 레거시 태그를 거부한다", () => {
  assert.throws(() => resolveVersion("v27.1"), /vX\.Y\.Z/);
  assert.throws(() => resolveVersion("v27.1.NaN"), /vX\.Y\.Z/);
});
