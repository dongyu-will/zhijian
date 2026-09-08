# Use combined Catalog and scheduled build triggers

Catalog Pull Requests run validation only. A Catalog merge, a site repository push, a daily schedule, or a manual dispatch may start the static site build. The schedule provides a simple refresh path for author repositories that cannot notify the site directly.

The workflow may cache package-manager dependencies, but it does not cache author repository content; every build re-reads the default branch.
