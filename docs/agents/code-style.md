# Code Style And Change Boundaries

This repository is a static Astro site that turns public Markdown repositories into a human-readable catalog. Keep changes close to the layer that owns the behavior.

## Source Of Truth

- `catalog/books/*.yaml` is the source of truth for public GitHub books. Add or remove a catalog entry there; do not duplicate it in page templates.
- `src/data/*.ts` is for application-owned data that is not part of the external catalog. Do not add third-party books, scans, or generated corpora to the public repository without clear redistribution rights.
- `src/lib/` owns parsing, cloning, discovery, rendering, and URL mapping. Pages and components should call these helpers instead of reimplementing them.
- `src/components/` owns reusable reader UI. Keep route-specific data preparation in the page and interaction code next to the markup it controls.
- `src/styles/reader.css` is the shared style sheet. Reuse existing variables and component patterns before adding a new selector or color.
- `content/` is reserved for intentionally redistributed canonical source content. Generated HTML belongs in `dist/` and must not be edited by hand.

## TypeScript And Astro

- Use TypeScript for application logic and define types at module boundaries.
- Prefer named functions for exported behavior and small pure helpers for URL, path, and content transformations.
- Keep Astro frontmatter limited to data loading, derived view models, and route generation. Put reusable logic in `src/lib/` or `src/data/`.
- Keep HTML semantic: use headings in order, links for navigation, buttons for actions, and labels for form controls.
- Preserve accessible names on icon-only controls with `aria-label`; keep keyboard behavior and focus return when changing dialogs or drawers.
- Escape or sanitize external Markdown through the existing renderer. Do not add a second HTML rendering path.
- Use `import.meta.env.BASE_URL` for internal links and asset paths. Do not hard-code `/wiki` or `/` into route code.

## Naming And Formatting

- Use `camelCase` for variables and functions, `PascalCase` for component files and exported types, and kebab-case for catalog slugs and URL segments.
- Name values after their domain meaning (`sourcePath`, `entryDocument`, `currentIndex`) rather than their UI position (`item1`, `leftThing`).
- Keep one responsibility per function. Extract a helper when a page starts mixing discovery, transformation, and rendering logic.
- Prefer early returns for invalid input and include the relevant file, book, or stage in thrown errors.
- Keep comments short and explain why a non-obvious boundary exists. Do not narrate obvious code.
- Preserve the repository's existing formatting style: two-space indentation, single quotes in TypeScript, semicolons, and compact Astro markup where it remains readable.

## Content And Catalog Changes

- Catalog entries must use public HTTPS GitHub repository URLs and a unique kebab-case filename slug.
- Keep author repositories read-only at build time. Never execute their scripts, package managers, workflows, or build configuration.
- Markdown discovery and entry-document rules belong in `src/lib/github-source.ts` and its ADRs. Update the rule there and in the relevant documentation together.
- Local-content repairs belong in a focused script or an intentionally redistributed canonical source. Do not patch generated pages or `dist/` output.

## Verification

Run the smallest useful set while iterating, then run the full gate before opening a PR:

```sh
npm run check
npm run validate:catalog
npm run verify
```

`npm run verify` runs Astro diagnostics, catalog validation, and the static build. The build reads active public repositories, so network failures are build failures and should be reported as such.

For UI changes, also verify the affected route in a browser at desktop and mobile widths. For content or route changes, check one ordinary Markdown page and any local fixture route that is intentionally part of the public repository.

## Pull Request Expectations

- Keep one user-visible or architectural purpose per PR.
- Explain the behavior before and after, list the validation commands, and call out any skipped browser or network checks.
- Include screenshots for visible UI changes, with desktop and mobile evidence when layout changes.
- Update `CONTEXT.md`, an ADR, or this guide when a terminology or architectural rule changes.
- Do not include generated `dist/`, temporary screenshots, cloned repositories, or local caches in a PR.
