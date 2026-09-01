// 트랙 승격이 릴리즈 태그가 정한 versionCode 하나만 올리는지 검사한다.
// Google Play API 클라이언트가 없는 정적 게이트에서도 돌아야 하므로 업로더를 import 하거나
// 실행하지 않고, argparse 선언과 승격 경로를 소스 수준에서 확인한다.
import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import test from "node:test";

const uploaderPath = fileURLToPath(new URL("./upload-google-play-internal.py", import.meta.url));
const source = readFileSync(uploaderPath, "utf8");

function argparseNames() {
  const script = `
import ast, sys
tree = ast.parse(open(sys.argv[1], encoding="utf-8").read())
names = {
    argument.value
    for node in ast.walk(tree)
    if isinstance(node, ast.Call) and getattr(node.func, "attr", "") == "add_argument"
    for argument in node.args
    if isinstance(argument, ast.Constant) and isinstance(argument.value, str)
}
print("\\n".join(sorted(names)))
`;
  return execFileSync("python3", ["-c", script, uploaderPath], {encoding: "utf8"})
    .split("\n")
    .filter(Boolean);
}

test("업로더가 --promote-version-code 를 수용한다", () => {
  const names = argparseNames();
  assert.ok(names.includes("--promote-version-code"), names.join(" "));
  for (const required of ["--promote", "--promote-from-track", "--promote-to-track"]) {
    assert.ok(names.includes(required), `${required} 누락: ${names.join(" ")}`);
  }
});

test("승격 대상은 트랙 최신 build 가 아니라 태그가 정한 versionCode 하나다", () => {
  // 이전 구현은 원본 트랙의 max(versionCodes) 를 올렸다. 계약은 이를 금지한다.
  assert.doesNotMatch(source, /versionCodes":\s*\[str\(max\(codes\)\)\]/);
  assert.match(source, /"versionCodes":\s*\[str\(version_code\)\]/);
  assert.match(source, /--promote-version-code is required/);
  assert.match(source, /is not on \{args\.promote_from_track\}/);
});

test("업로더는 파이썬 구문이 유효하다", () => {
  execFileSync("python3", ["-c", "import ast,sys;ast.parse(open(sys.argv[1],encoding='utf-8').read())", uploaderPath]);
});
