---
name: repository-documentation-standards
description: >-
  Official rules and guidelines for Gold-Standard Repository Documentation and
  AI Documentation Anti-Pattern Prevention across NovWrite.
trigger: always_on
---

# Official Rule: Repository Documentation Standards & AI Anti-Pattern Prevention

## 1. Core Documentation Philosophy

Every document in this repository is an authoritative, first-class engineering artifact. Documentation must represent actual codebase behavior with 100% precision.

### Strict Prohibitions (AI Anti-Patterns)

Do NOT:

- ❌ **Invent or Hallucinate Commands/Flags:** Never document CLI arguments, flags, or script names that do not exist in workspace `package.json`, `go.mod`, or shell scripts.
- ❌ **Use Lazy Placeholders:** Never write `// TODO: add logic here`, `// ... rest of code`, or generic hand-waving stubs in examples.
- ❌ **Use Robotic Marketing Fluff:** Avoid hyperbolic adjectives (*"revolutionary"*, *"seamless"*, *"cutting-edge"*, *"game-changing"*, *"empowers users with unmatched synergy"*).
- ❌ **Allow Code-Doc Drift:** Every documented endpoint route, query param, database column, or schema model must match the Go backend and Prisma schema verbatim.
- ❌ **Invert Technical Depth:** Do not spend paragraphs on generic programming concepts while glossing over complex AST formulas, state folds, or DAG cycle detection.
- ❌ **Write Broken/Hypothetical Paths:** Never output fake paths like `file:///path/to/...` or links to non-existent files.
- ❌ **Ignore Failure Modes:** Never document only the happy path (`200 OK`). Always document RFC 7807 problem details, error codes, and edge case recoveries.
- ❌ **Produce Monolithic Walls of Text:** Always use structured markdown with headings, comparison tables, GitHub alert callouts, and syntax-highlighted code blocks.
- ❌ **Use ASCII Art Box Drawings:** Never draw diagrams or tables using ASCII text boxes (`┌─┐`, `│ │`, `└─┘`, `+---+`). Always use proper tools: **Mermaid.js** for visual diagrams/DAGs/flows and **Markdown Tables** for structured tabular mappings.

---

## 2. Standard Documentation Requirements

1. **5-Minute Quickstart:** Fast, copy-pasteable bootstrap commands with explicit version numbers (Go 1.23+, Node 22 LTS, pnpm 9+, PostgreSQL 18 with pgvector, Redis 7.2+).
2. **Cross-Platform Parity:** Document Unix (`.sh`) and Windows (`.ps1`) commands equally.
3. **Atomic Synchronization:** Update documentation in the exact same commit as code changes.
4. **Diagnostic & Test Verification:** Before committing documentation, `./check.sh` and `./test.sh` must pass with 0 errors and 0 warnings.
5. **GPG Signed Commits:** All documentation commits must be GPG signed (`git commit -S`).
