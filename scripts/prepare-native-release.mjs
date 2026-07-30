#!/usr/bin/env node
import {readFileSync} from "node:fs";
import {spawnSync} from "node:child_process";

const platform =
  process.argv.includes("--android") ? "android" : process.argv.includes("--ios") ? "ios" : "";
if (!platform) {
  console.error("--android 또는 --ios가 필요합니다.");
  process.exit(1);
}

const packageVersion = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
).version;
const releaseVersion = process.env.RELEASE_VERSION || packageVersion;
if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(releaseVersion)) {
  console.error(`RELEASE_VERSION이 stable SemVer가 아닙니다: ${releaseVersion}`);
  process.exit(1);
}

function run(command, args, env = process.env) {
  const result = spawnSync(command, args, {stdio: "inherit", env});
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run("npm", ["run", "build:web"], {
  ...process.env,
  VITE_APP_VERSION: releaseVersion,
});
run("npx", ["--no-install", "cap", "sync", platform]);
