#!/usr/bin/env node
/**
 * Google Play Data safety 공시가 실제 코드의 데이터 수집 상태와 어긋나지 않는지 검사한다.
 *
 * Play 공개 listing이 "No data collected"인데 앱은 GA4 이벤트를 보내는 불일치가
 * 재발하지 않도록, 계측이 살아 있으면 공시 source-of-truth도 수집을 인정해야 한다.
 *
 * 실행: npm run check:data-safety
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = join(root, "ops/google-play-data-safety.json");

function fail(message) {
  console.error(`[data-safety] ${message}`);
  process.exitCode = 1;
}

function listSourceFiles(dir) {
  const entries = readdirSync(dir);
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...listSourceFiles(full));
    } else if (/\.(ts|tsx)$/.test(entry) && !/\.test\.(ts|tsx)$/.test(entry)) {
      files.push(full);
    }
  }
  return files;
}

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const sources = listSourceFiles(join(root, "src"));

const analyticsInUse = sources.some((file) => {
  const code = readFileSync(file, "utf8");
  return /\btrackEvent\s*\(/.test(code) || /logEvent\s*\(/.test(code);
});

const measurementIdActive = /measurementId:[\s\S]*?"G-[A-Z0-9]+"/.test(
  readFileSync(join(root, "src/firebase/config.ts"), "utf8"),
);

const adsInUse = sources.some((file) =>
  /showFullScreenAd|loadFullScreenAd/.test(readFileSync(file, "utf8")),
);

const collecting = analyticsInUse || measurementIdActive;

if (collecting && manifest.no_data_collected !== false) {
  fail(
    "GA4 계측(trackEvent/measurementId)이 활성인데 공시가 'no data collected'로 남아 있다.",
  );
}

const declared = Array.isArray(manifest.collection) ? manifest.collection : [];
const declaredTypes = declared
  .filter((item) => item.collected === true)
  .map((item) => `${item.category}/${item.type}`);

if (collecting && declaredTypes.length === 0) {
  fail("수집 중인데 공시에 collected=true 항목이 하나도 없다.");
}

if (
  collecting &&
  !declaredTypes.includes("App activity/App interactions")
) {
  fail("GA4 이벤트 수집은 'App activity / App interactions'로 공시해야 한다.");
}

if (
  (collecting || adsInUse) &&
  !declaredTypes.includes("Device or other IDs/Device or other IDs")
) {
  fail(
    "Firebase/광고 SDK는 기기 식별자를 사용하므로 'Device or other IDs' 공시가 필요하다.",
  );
}

if (!collecting && declaredTypes.length > 0) {
  fail("계측이 비활성인데 공시는 수집을 주장한다. 둘 중 하나가 오래된 상태다.");
}

if (process.exitCode) {
  console.error(
    "[data-safety] ops/google-play-data-safety.json 과 Play Console Data safety를 함께 갱신하세요.",
  );
} else {
  console.log(
    `[data-safety] OK — analytics=${collecting}, ads=${adsInUse}, declared=${declaredTypes.length}`,
  );
}
