# 知间 · Zhijian Knowledge Library

A public reading library that aims to connect knowledge across publications while preserving complete, attributable source material.

## Language

**Resource**: A published collection of related content, such as a book, article, lecture note, tutorial, or exam collection. Its internal structure is chosen by the author.
_Avoid_: Mandatory book hierarchy

**Content Document**: A canonical Markdown document within a Resource. Rendered pages and search text are derived from it.
_Avoid_: Generated HTML, search chunk

**Entry Document**: The document used when opening a Resource. A root README is preferred when present; otherwise the first discovered Markdown document is used.
_Avoid_: Required introduction template

**Knowledge Point**: A concept that can appear in multiple documents or Resources, with different explanations, examples, or applications.
_Avoid_: A book title, a single question, a fixed-size text chunk

**Knowledge Connection**: A curated relationship between a Knowledge Point and a concrete source passage, or between related Knowledge Points. It provides navigation and context without replacing the source content.
_Avoid_: Quality ranking, unverified keyword match

**Source Reference**: A link to the source document and the relevant location within it, allowing a reader to inspect the original context.
_Avoid_: An unsupported summary

**Bundled Resource**: Content intentionally included in the site's own source repository with permission to publish it.
_Avoid_: Local OCR cache, unpublished original

**Catalog Entry**: Registration of a Resource from an external public GitHub repository, with a stable identity and an optional selected source directory.
_Avoid_: The entire repository identity

**Book Source Root**: The selected directory that bounds one Resource's content discovery, relative links, and published assets.
_Avoid_: Automatically inferred sub-book, unrestricted filesystem path

**Current-Book Search**: Search within the currently opened Resource, returning source sections with matching text.
_Avoid_: Cross-resource search, knowledge-point matching

**Human Reader**: A person reading and comparing the source material.
_Avoid_: An account or a paid subscriber

**AI Consumer**: A machine consumer of the same canonical knowledge, a longer-term audience alongside human readers.
_Avoid_: Autonomous publisher, required chat interface

**Static Deployment**: Generated pages and approved assets published without a running content backend.
_Avoid_: A live editing service
