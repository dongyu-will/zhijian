import { lstatSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { ignoredSourceDirectories } from './github-source';

export function isValidRootDirectory(value: string): boolean {
  if (value === '.') return true;
  if (!value || value !== value.trim() || /[\u0000-\u001f\u007f\\:%?#]/.test(value)) return false;
  return value.split('/').every((segment) =>
    Boolean(segment) && !segment.startsWith('.') && !ignoredSourceDirectories.has(segment)
  );
}

export function resolveBookSourceRoot(repositoryRoot: string, rootDirectory = '.'): string {
  if (!isValidRootDirectory(rootDirectory)) {
    throw new Error(`Invalid rootDirectory: ${JSON.stringify(rootDirectory)}`);
  }
  let current = resolve(repositoryRoot);
  const paths = [current];
  if (rootDirectory !== '.') {
    for (const segment of rootDirectory.split('/')) {
      current = join(current, segment);
      paths.push(current);
    }
  }
  for (const path of paths) {
    const stats = lstatSync(path);
    if (stats.isSymbolicLink() || !stats.isDirectory()) {
      throw new Error(`rootDirectory must select real directories without symbolic links: ${rootDirectory}`);
    }
  }
  return current;
}
