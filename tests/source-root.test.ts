import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { resolveBookSourceRoot } from '../src/lib/source-root';
import { sourceFileUrl } from '../src/lib/github-source';

test('selects only existing real directories and refuses symlinks at any selected component', () => {
  const root = mkdtempSync(join(tmpdir(), 'wiki-source-root-'));
  try {
    mkdirSync(join(root, 'books/高数'), { recursive: true });
    writeFileSync(join(root, 'file.md'), '# Not a directory');
    symlinkSync(join(root, 'books'), join(root, 'alias'));
    symlinkSync(join(root, 'books/高数'), join(root, 'books/alias'));
    symlinkSync('/nonexistent-wiki-root', join(root, 'broken'));
    assert.equal(resolveBookSourceRoot(root), root);
    assert.equal(resolveBookSourceRoot(root, 'books/高数'), join(root, 'books/高数'));
    for (const path of ['alias/高数', 'books/alias', 'broken', 'missing', 'file.md', '../', '.git']) {
      assert.throws(() => resolveBookSourceRoot(root, path), path);
    }
    assert.throws(() => resolveBookSourceRoot(join(root, 'alias')), /symbolic links/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('source URLs retain repository-relative prefixes and encode each path segment', () => {
  const url = sourceFileUrl({
    repository: 'https://github.com/example/books.git/', localPath: '', defaultBranch: 'main', commitSha: 'abc'
  }, 'books/高数 讲义/chapters/01.md');
  assert.equal(url, 'https://github.com/example/books/blob/main/books/%E9%AB%98%E6%95%B0%20%E8%AE%B2%E4%B9%89/chapters/01.md');
});
