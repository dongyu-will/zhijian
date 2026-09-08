# Keep Catalog Pull Request checks structural

Catalog Pull Requests validate YAML syntax, required fields, allowed status values, slug uniqueness, and public HTTPS GitHub repository shape. They do not fetch or render complete author repositories; full content availability is checked by the site build so Catalog review stays fast and deterministic.
