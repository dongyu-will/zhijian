## Repository guidance

Read `docs/agents/code-style.md` before changing application code, build logic, catalog data, or content-processing scripts. It defines source-of-truth boundaries and verification requirements.

When changing domain terminology or architectural decisions, read `docs/agents/domain.md` and `CONTEXT.md`.

Keep internal agent state, local issues, design captures, prototypes, build output, and dependency installs in ignored paths.

Finish normal changes with `npm run verify`. For documentation-only changes, run the narrowest relevant check and report which broader checks were skipped.
