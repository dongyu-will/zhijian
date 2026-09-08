# Use Markdown as the canonical content format

Native Content will be stored as Markdown with YAML metadata and controlled
semantic directives, while content-specific structures are stored separately as
extensible manifests and relations. The Engine parses these sources into a
validated semantic representation and generates HTML or other delivery formats,
keeping Git diffs portable and AI-readable instead of treating generated HTML
as source content. V1 supports Markdown only; future source formats may add
adapters without expanding the initial implementation.
