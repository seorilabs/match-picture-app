import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";

const workflow = (name) =>
  readFileSync(new URL(`../.github/workflows/${name}`, import.meta.url), "utf8");

test("세 마켓의 표준 배포 workflow와 통합 호출을 유지한다", () => {
  const all = workflow("deploy-all.yml");

  for (const file of [
    "deploy-apps-in-toss.yml",
    "deploy-google-play.yml",
    "deploy-app-store.yml",
  ]) {
    assert.match(all, new RegExp(`uses: \\.\\/.github\\/workflows\\/${file}`));
  }
});

test("AppsInToss 배포 workflow는 org 재사용 계약을 유지한다", () => {
  const ait = workflow("deploy-apps-in-toss.yml");

  assert.match(
    ait,
    /uses: seorilabs\/\.github\/\.github\/workflows\/rn-deploy-ait\.yml@main/,
  );
  assert.match(ait, /release_tag: \$\{\{ inputs\.release_tag \}\}/);
});
