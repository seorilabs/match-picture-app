# Codex Agent 지침

이 파일은 `.cursor/rules/project-context.mdc`와 동일한 프로젝트 공통 지침입니다.
프로젝트 수준 지침을 변경할 때는 두 파일을 함께 갱신합니다.

개인 환경의 절대 경로나 비공개 문서 위치는 `AGENTS.local.md`에만 기록합니다.
`AGENTS.local.md`는 git에 커밋하지 않습니다.

## 프로젝트 컨텍스트

이 프로젝트는 Unity 원본 프로젝트를 Apps in Toss WebView/Granite 기반 앱으로 포팅하는 작업입니다.

작업을 시작하기 전에 다음 컨텍스트를 우선 확인합니다.

- 원본 Unity 프로젝트: 로컬 위치는 `AGENTS.local.md`를 확인합니다.
- 설계/계획 문서: Obsidian 볼트 루트 기준 `프로젝트/같은그림찾기`
- Apps in Toss 문서 인덱스: `.cursor/skills/apps-in-toss.md`

## 작업 원칙

- 기능을 구현하기 전에 원본 Unity 프로젝트의 실제 동작과 에셋 구조를 먼저 확인합니다.
- 요구사항이나 구현 우선순위가 불분명하면 설계/계획 문서를 먼저 확인합니다.
- 원본 소스와 Obsidian 문서는 참고용으로 다루며, 명시 요청이 없으면 수정하지 않습니다.
- 현재 프로젝트의 구조, TypeScript/React/Vite 스타일, Apps in Toss WebView/Granite 제약에 맞춰 최소 범위로 반영합니다.
- Apps in Toss 관련 API나 정책 판단이 필요하면 `.cursor/skills/apps-in-toss.md`와 공식 Apps in Toss 문서를 함께 확인합니다.
