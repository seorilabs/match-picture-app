// 트랙 승격이 릴리즈 태그가 정한 versionCode 하나만 올리는지 검사한다.
// 실제 Google Play API 는 호출하지 않고 스크립트 계약만 확인한다.
import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {readFileSync} from "node:fs";
import test from "node:test";

const uploader = new URL("./upload-google-play-internal.py", import.meta.url);
const source = readFileSync(uploader, "utf8");

test("업로더가 --promote-version-code 를 수용한다", () => {
  const help = execFileSync("python3", [uploader.pathname, "--help"], {encoding: "utf8"});
  assert.match(help, /--promote-version-code/);
});

test("승격 대상은 트랙 최신 build 가 아니라 태그가 정한 versionCode 하나다", () => {
  // 이전 구현은 원본 트랙의 max(versionCodes) 를 올렸다. 계약은 이를 금지한다.
  assert.doesNotMatch(source, /versionCodes":\s*\[str\(max\(codes\)\)\]/);
  assert.match(source, /"versionCodes":\s*\[str\(version_code\)\]/);
  assert.match(source, /--promote-version-code is required/);
  assert.match(source, /is not on \{args\.promote_from_track\}/);
});

test("promote 는 version code 없이 실행되지 않는다", () => {
  const result = execFileSync(
    "python3",
    ["-c", `
import ast, sys
source = open(${JSON.stringify(uploader.pathname)}, encoding="utf-8").read()
tree = ast.parse(source)
names = {
  argument.value
  for node in ast.walk(tree)
  if isinstance(node, ast.Call) and getattr(node.func, "attr", "") == "add_argument"
  for argument in node.args
  if isinstance(argument, ast.Constant) and isinstance(argument.value, str)
}
print("--promote-version-code" in names)
`],
    {encoding: "utf8"},
  );
  assert.equal(result.trim(), "True");
});
