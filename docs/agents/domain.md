# Domain docs

This repository uses a single-context domain-documentation layout.

## Before exploring

- Read `CONTEXT.md` when it exists.
- Read relevant decisions under `docs/adr/`.
- If these files do not exist, proceed without creating placeholders.

## Layout

- `CONTEXT.md` contains the project glossary and domain model.
- `docs/adr/` contains hard-to-reverse architectural decisions.
- Domain documents are created lazily when terms or decisions are resolved.

Use terminology defined in `CONTEXT.md` consistently in code, tests,
specifications, tickets, and documentation. Record decisions that constrain
future implementation as ADRs.
