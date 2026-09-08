import { execFileSync } from 'node:child_process';
import { existsSync, lstatSync, readdirSync, readFileSync } from 'node:fs';
import { basename, join, relative, resolve, sep } from 'node:path';

export type SourceSnapshot = {
  repository: string;
  localPath: string;
  defaultBranch: string;
  commitSha: string;
};

export async function fetchRepositoryStars(repository: string): Promise<number | null> {
  const parts = new URL(repository).pathname.replace(/\/$/, '').replace(/\.git$/i, '').split('/').filter(Boolean);
  if (parts.length !== 2) return null;
  try {
    const response = await fetch(`https://api.github.com/repos/${parts[0]}/${parts[1]}`, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'wiki-catalog-site',
        ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {})
      }
    });
    if (!response.ok) return null;
    const data = await response.json() as { stargazers_count?: unknown };
    return typeof data.stargazers_count === 'number' ? data.stargazers_count : null;
  } catch {
    return null;
  }
}

export const ignoredSourceDirectories = new Set([
  '.git', '.github', '.astro', '.cache', '_site', 'build', 'bower_components',
  'coverage', 'dist', 'node_modules', 'out', 'vendor'
]);

export const ignoredSourceFiles = new Set([
  'summary.md',
  'sidebar.md',
  'toc.md',
  'table-of-contents.md'
]);

function isIgnoredSourcePath(path: string): boolean {
  return path.split('/').some((segment) => segment.startsWith('.') || ignoredSourceDirectories.has(segment));
}

function runGit(args: string[], cwd?: string): string {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

export function clonePublicGitHubRepository(repository: string, destination: string): SourceSnapshot {
  const url = new URL(repository);
  if (url.protocol !== 'https:' || url.hostname !== 'github.com') {
    throw new Error(`Only public HTTPS GitHub repositories are supported: ${repository}`);
  }

  execFileSync('git', ['clone', '--depth=1', '--no-tags', '--no-recurse-submodules', repository, destination], {
    stdio: 'inherit',
    ...(process.env.NODE_ENV === 'production' ? {} : { timeout: 15_000 })
  });
  const defaultBranch = runGit(['symbolic-ref', '--short', 'HEAD'], destination);
  const commitSha = runGit(['rev-parse', 'HEAD'], destination);
  return { repository, localPath: destination, defaultBranch, commitSha };
}

export type SourceDiscovery = {
  files: string[];
  warnings: string[];
};

export function discoverSourceFiles(sourceRoot: string): SourceDiscovery {
  const root = resolve(sourceRoot);
  const files: string[] = [];
  const warnings: string[] = [];

  function visit(directory: string): void {
    for (const name of readdirSync(directory).sort()) {
      const path = join(directory, name);
      const sourcePath = relative(root, path).split(sep).join('/');
      if (isIgnoredSourcePath(sourcePath)) continue;
      const stats = lstatSync(path);
      if (stats.isSymbolicLink()) {
        warnings.push(`${sourcePath}: symbolic link was skipped`);
        continue;
      }
      if (stats.isDirectory()) visit(path);
      else if (stats.isFile()) files.push(sourcePath);
    }
  }

  visit(root);
  return { files: files.sort(), warnings };
}

export function isDiscoverableMarkdownFile(path: string): boolean {
  return /\.(?:md|markdown)$/i.test(path) && !ignoredSourceFiles.has(basename(path).toLowerCase());
}

export function discoverMarkdownFiles(root: string): string[] {
  return discoverSourceFiles(root).files.filter(isDiscoverableMarkdownFile);
}

export function chooseEntryMarkdown(files: string[]): string {
  return files.find((file) => file.toLowerCase() === 'readme.md')
    ?? files[0]
    ?? (() => { throw new Error('No Markdown files found in source repository'); })();
}

export function readMarkdown(root: string, sourcePath: string): string {
  const rootPath = resolve(root);
  const path = resolve(rootPath, sourcePath);
  const relativePath = relative(rootPath, path);
  if (relativePath === '..' || relativePath.startsWith(`..${sep}`) || !existsSync(path)) {
    throw new Error(`Invalid Markdown path: ${sourcePath}`);
  }
  return readFileSync(path, 'utf8');
}

export function sourceFileUrl(snapshot: SourceSnapshot, sourcePath: string): string {
  const repository = snapshot.repository.replace(/\/$/, '').replace(/\.git$/i, '');
  return `${repository}/blob/${encodeURIComponent(snapshot.defaultBranch)}/${sourcePath.split('/').map(encodeURIComponent).join('/')}`;
}

export function titleFromSourcePath(sourcePath: string): string {
  return basename(sourcePath).replace(/\.markdown?$/i, '').replace(/[-_]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}
