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
    /uses: seorilabs\/\.github\/\.github\/workflows\/rn-deploy-ait\.yml@[0-9a-f]{40}/,
  );
  assert.match(ait, /release_tag: \$\{\{ inputs\.release_tag \}\}/);
});

test("org 재사용 workflow 호출은 모두 immutable commit SHA로 고정한다", () => {
  // floating ref는 release binding의 config revision을 고정할 수 없어
  // release-version-authority-v1에서 즉시 결함으로 본다.
  for (const file of [
    "cleanup-actions-storage.yml",
    "deploy-app-store.yml",
    "deploy-apps-in-toss.yml",
    "deploy-google-play.yml",
    "promote-google-play.yml",
    "release-tag.yml",
    "static-checks.yml",
  ]) {
    for (const line of workflow(file).split("\n")) {
      const match = /uses:\s*(seorilabs\/\.github\/\S+)/.exec(line);
      if (match !== null) {
        assert.match(match[1], /@[0-9a-f]{40}$/, `${file}: ${match[1]}`);
      }
    }
  }
});

test("마켓 배포 caller는 제거된 version 입력을 넘기지 않는다", () => {
  // 버전은 stable SemVer 태그가 유일한 authority이고 중앙 워크플로우가 파생해 주입한다.
  for (const file of [
    "deploy-app-store.yml",
    "deploy-apps-in-toss.yml",
    "deploy-google-play.yml",
  ]) {
    const text = workflow(file);
    for (const input of ["version_name", "version_code", "version_script"]) {
      assert.doesNotMatch(text, new RegExp(`^\\s+${input}:`, "m"), `${file}: ${input}`);
    }
  }
});
