<!-- OPENSPEC:START -->

# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:

- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:

- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

## カスタムルール

- OpenSpecに沿って進める場合、タスク完了時、task.mdの該当タスクを、マークしてください
- タスク完了報告前に`npm run lint`を行い、エラーがあれば修正してください。

<!-- OPENSPEC:END -->

## コーディングガイドライン

### CSS

- ネスト記法の使用を推奨
- rgb()関数の使用を推奨。rgba()は非推奨。
- メディアクエリは論理演算子を使用した範囲構文の使用を推奨。例：`@media (width <= 1000px)`
