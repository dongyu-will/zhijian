# Knowledge Repository Standard V1

V1 is a small compatibility contract for publishing public Markdown content, including articles, books, notes, tutorials, and exam collections. It accepts ordinary Markdown repositories while keeping the build host isolated from repository content.

## Minimum requirements

These rules apply within the selected Book Source Root (`rootDirectory` in the Catalog, default `.`). A repository can host multiple independently registered books; no book manifest or automatic folder classification is required.

- The selected directory contains at least one readable UTF-8 file ending in `.md` or `.markdown`.
- Markdown and optional YAML frontmatter can be parsed and rendered without a fatal error.
- The repository is treated only as data. The Engine never executes its scripts, workflows, package commands, or build configuration.

A root `README.md` becomes the Entry Document when present. Otherwise, the first Markdown document by normalized relative path is used. A document title may come from frontmatter, its first rendered heading, or its filename; a level-one heading is not required. The section map and HTML anchors come from the same rendered heading tree, including Setext and inline-formatted headings while excluding code-block text.

Reading order uses linked Markdown paths from a root `SUMMARY.md` when available, then falls back to Markdown links in README lists, and finally to normalized path order. The Entry Document remains first, and unlisted documents are appended. These navigation files are optional compatibility hints, not requirements.

Content Documents may use any directory layout. Hidden directories and conventional dependency or generated directories are excluded from discovery: `.git`, `.github`, `.astro`, `.cache`, `_site`, `build`, `bower_components`, `coverage`, `dist`, `node_modules`, `out`, and `vendor`. Common navigation files—`SUMMARY.md`, `sidebar.md`, `toc.md`, and `table-of-contents.md`—are treated as repository controls rather than reader documents.

## Optional organization

Use the structure that suits the material. No fixed book/chapter/question hierarchy, heading depth, numbering style, or introduction template is required. A single Markdown document is enough.

Frontmatter, short navigation labels, a table of contents, custom count units, and PDF page annotations are optional. Missing these enhancements does not make content invalid. The current local exam collections are examples, not a template other resources must follow.

## Links and assets

Relative links and local image paths are checked when possible. Links to discovered Markdown become reader routes; images, downloads, and other files resolve from the copied book asset root. All local path interpretation, including leading-slash paths, is scoped to the selected Book Source Root, not the enclosing Git repository. Query strings, fragments, URL-encoded paths, root-relative repository paths, and raw HTML links or images are preserved or normalized when safe. Missing files, invalid URL encoding, and relative references outside the selected root produce build warnings rather than conformance failures. External links and remote images are allowed.

Symbolic links are never followed. They are skipped with a warning during discovery and asset copying, preventing repository content from reading or publishing files from the build host. A symlink in the selected root's own path is a fatal root-selection error. Files outside the selected root are never copied: place shared resources within each book or use explicit external URLs; sibling-book links are not automatically resolved.

## Catalog and identity

The central Catalog supplies the public slug, title, author, description, repository URL, optional `rootDirectory`, and publication status. Each book has its own entry even when several books use one repository. `rootDirectory` defaults to `.`; other values must be visible slash-separated relative directory paths without empty, dot, parent, hidden or ignored dependency/build segments, backslashes, control characters or URL syntax/encoding. The selected path must exist and contain only real directories. Structural Catalog checks do not fetch repositories; existence is checked during the build. V1 does not require a repository manifest, Content Node IDs, custom relation data, multiple publications, or a `LICENSE` file.

A generated document is identified by the Catalog slug, repository commit SHA, and book-relative Markdown source path. The book-relative path also determines its public reader URL, so changing the enclosing repository directory does not change reader URLs if the slug and internal paths are preserved. GitHub source URLs include `rootDirectory` before the document path. Entries from the same repository share one snapshot per build.

## Validation

Repository authors can inspect a local checkout with:

```sh
npm run validate:repository -- /path/to/repository
```

For a book in a subdirectory, pass that selected directory instead, such as `/path/to/repository/books/calculus`.

The command reports compatibility warnings and fails only when the minimum requirements cannot be met. Active Catalog entries are checked again during the atomic site build; warnings do not prevent publication.
