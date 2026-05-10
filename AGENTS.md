# Codex Agent Instructions

This file mirrors `.cursor/rules/project-context.mdc` so Codex can use the same project instructions.
Keep both files in sync when project-level agent guidance changes.

## Project Context

This project ports the original Unity project to an Apps in Toss WebView/Granite based app.

Before starting work, prioritize these external contexts:

- Original source: `/Users/syous/Repositories/seoleeapps/MatchPictureUnity`
- Design/planning docs: `/Users/syous/Obsidian/Vault/30 Projects/Active/같은그림찾기`
- Apps in Toss docs index: `.cursor/skills/apps-in-toss.md`

## Working Principles

- Before implementing behavior, inspect the original Unity project's actual behavior and asset structure.
- If requirements or implementation priority are unclear, inspect the design/planning docs first.
- Treat the original source and Obsidian docs as references only; do not modify them unless explicitly requested.
- Apply changes in the smallest scope that fits this project's TypeScript/React/Vite style and Apps in Toss WebView/Granite constraints.
- When Apps in Toss API or policy judgment is needed, read `.cursor/skills/apps-in-toss.md` together with the official Apps in Toss documentation it links to.
