#!/usr/bin/env node
/**
 * 릴리스 .ait 가 잘못된 브랜드 값이나 광고 없는 상태로 조용히 나가는 것을 막는다.
 *
 * 예전 rn-deploy-ait 재사용 워크플로에는 require_ad_group_id 입력이 있어서 광고 ID 가
 * 비면 배포가 멈췄다. godot-deploy-ait 에는 그 입력이 없다. 그 가드를 여기서 대신한다.
 *
 * 실행: npm run check:brand (build 뒤에 붙어 있다)
 */
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const config = readFileSync(join(root, 'apps-in-toss.config.ts'), 'utf8')

const problems = []

function readField(name) {
  const match = config.match(new RegExp(`${name}:\\s*'([^']*)'`))
  return match?.[1] ?? ''
}

// 콘솔에 등록된 식별자다. 바뀌면 다른 앱으로 올라간다.
const appName = readField('appName')
if (appName !== 'match-picture-app') {
  problems.push(`appName 이 'match-picture-app' 이 아니다: '${appName}'`)
}

// SDK 3.x 부터 brand.displayName 과 brand.icon 은 설정 스키마에 없다. 콘솔이 가진다.
// 대신 게임 웹뷰 모드를 못 박는다. 이 키가 빠지면 토스 웹뷰에서 Godot wasm 이
// instantiate 되지 않고 스플래시에서 멈춘다. ait migrate 가 지우는 키라 매 빌드 확인한다.
const webViewType = readField('type')
if (webViewType !== 'game') {
  problems.push(
    `webView.type 이 'game' 이 아니다: '${webViewType}'. ` +
      '이 키가 없으면 토스 웹뷰에서 Godot wasm 이 로드되지 않는다.',
  )
}

// 광고 ID 는 CI 에서만 강제한다. 로컬 개발은 광고 없이 돌 수 있어야 한다.
if (process.env.CI) {
  const adGroupId = (process.env.VITE_TOSS_INTERSTITIAL_AD_GROUP_ID ?? '').trim()
  if (!adGroupId) {
    problems.push(
      'CI 인데 VITE_TOSS_INTERSTITIAL_AD_GROUP_ID 가 비어 있다. 광고 없는 빌드가 나간다.',
    )
  }
}

if (problems.length > 0) {
  for (const problem of problems) {
    console.error(`[ait-brand] ${problem}`)
  }
  process.exit(1)
}

console.log(`[ait-brand] OK — appName=${appName}, webView.type=${webViewType}`)
