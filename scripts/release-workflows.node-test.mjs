import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";

const workflow = (name) =>
  readFileSync(new URL(`../.github/workflows/${name}`, import.meta.url), "utf8");

test("deploy-all은 GitHub Actions에서 실행 가능한 마켓만 호출한다", () => {
  const all = workflow("deploy-all.yml");

  for (const file of ["deploy-apps-in-toss.yml", "deploy-google-play.yml"]) {
    assert.match(all, new RegExp(`uses: \\.\\/.github\\/workflows\\/${file}`));
  }

  // Apple archive의 표준 실행 환경은 Xcode Cloud다. GitHub macOS 러너로 우회하지 않는다.
  assert.doesNotMatch(all, /deploy-app-store\.yml/);
  assert.doesNotMatch(all, /deploy_app_store/);
});

test("App Store caller는 macOS 우회 없이 명시적 human gate로 남는다", () => {
  const appStore = workflow("deploy-app-store.yml");

  assert.doesNotMatch(appStore, /^  workflow_call:/m);
  assert.doesNotMatch(appStore, /runs-on:\s*macos/);
  assert.doesNotMatch(appStore, /rn-deploy-app-store/);
  assert.match(appStore, /Xcode Cloud/);
  assert.match(appStore, /exit 1/);
});

test("AppsInToss 배포 workflow는 org 재사용 계약을 유지한다", () => {
  const ait = workflow("deploy-apps-in-toss.yml");

  assert.match(
    ait,
    /uses: seorilabs\/\.github\/\.github\/workflows\/rn-deploy-ait\.yml@main/,
  );
  assert.match(ait, /release_tag: \$\{\{ inputs\.release_tag \}\}/);
});

test("org 재사용 workflow 호출은 모두 중앙 정본 main을 가리킨다", () => {
  // caller는 org 정본의 현재 계약을 따른다. SHA로 핀하면 중앙에서 계약을 고쳐도
  // 저장소마다 ref를 갱신해야 반영돼 정본이 갈라진다. 임의 브랜치나 fork를 막기 위해
  // 허용 ref는 main 하나로 고정한다.
  for (const file of [
    "cleanup-actions-storage.yml",
    "deploy-app-store.yml",
    "deploy-apps-in-toss.yml",
    "deploy-google-play.yml",
    "init-release-version-ledger.yml",
    "promote-google-play.yml",
    "release-tag.yml",
    "static-checks.yml",
  ]) {
    for (const line of workflow(file).split("\n")) {
      const match = /uses:\s*(seorilabs\/\.github\/\S+)/.exec(line);
      if (match !== null) {
        assert.match(match[1], /@main$/, `${file}: ${match[1]}`);
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

test("AIT caller의 artifact_path는 단일 .ait glob이다", () => {
  // org 재사용 workflow는 이 값을 ARTIFACT_GLOB으로 확장해 "정확히 한 개"를 요구한다.
  // 여러 줄이나 dist/** 같은 광범위 glob을 넘기면 빌드 성공 뒤 산출물 해석에서 실패한다.
  const ait = workflow("deploy-apps-in-toss.yml");

  const match = /^\s*artifact_path:\s*(.*)$/m.exec(ait);
  assert.notEqual(match, null, "artifact_path를 명시해야 한다");

  const value = match[1].trim();
  assert.doesNotMatch(value, /^[|>]/, "블록 스칼라로 여러 줄을 넘기면 안 된다");

  const glob = value.replace(/^["']|["']$/g, "");
  assert.match(glob, /\.ait$/, `단일 .ait glob이어야 한다: ${glob}`);
  assert.doesNotMatch(glob, /\*\*/, `재귀 glob은 여러 개로 확장된다: ${glob}`);
});
