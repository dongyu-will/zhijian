# Fail atomically on active book errors

If an active Catalog Entry cannot be fetched, parsed, or rendered, the complete static site build fails. GitHub Pages therefore keeps the last successful deployment instead of publishing a catalog with missing or partially generated books.
