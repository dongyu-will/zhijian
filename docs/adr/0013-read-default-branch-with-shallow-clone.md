# Read the default branch with a shallow clone

Each site build obtains an active author's public repository with a shallow, no-tags, no-submodules clone and resolves the repository's default branch. Catalog entries do not configure branches, tags, or commits; the build always renders the latest default-branch content available at build time.
