# Report book build failures with recovery context

When an active book fails during clone, discovery, parse, or render, the GitHub Actions log reports the book title, repository URL, failed stage, and a concise recovery hint. The build still fails atomically so the last successful Pages deployment remains intact while maintainers can diagnose the source.
