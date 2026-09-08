# Select book roots within shared repositories

## Decision

The Catalog registers books, not repositories. Each YAML filename remains the book's stable public slug. Add optional `rootDirectory`, defaulting to `.`, so independent books can select separate directories of the same external public GitHub repository. Existing entries retain whole-repository behavior. No automatic book-folder discovery is introduced.

Catalog loading and structural PR validation share one schema. A root is `.` or a visible slash-separated relative directory path; reject traversal, empty or dot segments, hidden or ignored dependency/build directories, backslashes, control characters and URL syntax/encoding. At build time, verify the selected directory exists and reject files or symbolic links at any selected path component before reading content.

Validate, discover, order, render and copy assets only within the selected root. README and SUMMARY lookup is relative to this root. Markdown paths and public reader/asset URLs remain book-relative; GitHub source links include the repository-relative root prefix. The slug, not repository location, establishes public book identity.

Each catalog build shares one shallow default-branch snapshot and stars request per repository, including URL casing, trailing-slash and `.git` aliases. All its books use the same commit SHA. Cache clone failures within that build as well, and dispose all temporary clones on success or failure. Later builds fetch fresh snapshots. Blocked entries do not trigger cloning. Active failures still abort production builds; development may skip failed books while rendering valid siblings.

## Boundaries and consequences

- Authors may use one repository per book or one repository for multiple books without changing public reader behavior.
- A whole-repository entry still includes every discoverable document under it; registering subdirectories does not subtract them from a parent entry. Avoid overlapping roots unless duplicate publication is intentional.
- Resources outside a selected root are not copied, including sibling-book content and repository-level shared assets. Links escaping the root remain unresolved under existing renderer behavior; no cross-book lookup is inferred. Leading-slash local paths resolve within the book root. Use explicit external/site URLs for cross-book links, or keep resources within the book.
- Selecting an empty, absent or symlinked root is a source error with title, repository and root context, not permission to fall back to the whole repository.
- Repository-root selection does not execute author code or alter source repositories. Content imports, OCR, editorial workflows and a future cross-book relation model remain outside this change.

This extends [file-per-book Catalog registration](0010-use-file-per-book-catalog.md), [discovery and stable URLs](0011-discover-markdown-and-map-stable-urls.md), [shallow snapshots](0013-read-default-branch-with-shallow-clone.md), [read-only boundaries](0014-keep-author-repositories-read-only-at-build.md), and [structural checks](0016-keep-catalog-pr-checks-structural.md).
