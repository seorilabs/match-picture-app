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
const config = readFileSync(join(root, 'granite.config.ts'), 'utf8')

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

const displayName = readField('displayName')
if (!displayName.trim()) {
  problems.push('brand.displayName 이 비어 있다.')
}

const icon = readField('icon')
if (!icon.startsWith('https://')) {
  problems.push(`brand.icon 이 HTTPS URL 이 아니다: '${icon}'`)
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

console.log(`[ait-brand] OK — appName=${appName}, displayName=${displayName}`)
