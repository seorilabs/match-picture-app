# release-version-ledger

기계가 쓰는 릴리스 번호 원장이다. 직접 편집하거나 PR로 병합하지 않는다.

- 계약: seorilabs/.github `contracts/release-version-ledger.yaml`
- 감사: `node scripts/release/audit-release-tags.mjs <저장소> --full-name <owner/repo> --fetch`

이 브랜치의 이력이 곧 Android versionCode 할당 이력이다.
