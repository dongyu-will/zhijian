import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { stringify } from 'yaml';
import { loadCatalog } from '../src/lib/catalog-loader';

function withCatalog(run: (root: string, save: (fields?: Record<string, unknown>) => void) => void): void {
  const root = mkdtempSync(join(tmpdir(), 'wiki-catalog-test-'));
  const save = (fields: Record<string, unknown> = {}) => writeFileSync(join(root, 'sample.yaml'), stringify({
    title: 'Sample', author: 'Author', repository: 'https://github.com/example/books', ...fields
  }));
  try {
    run(root, save);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test('defaults legacy entries to repository root and accepts multiple books from one repository', () => {
  withCatalog((root, save) => {
    save();
    assert.equal(loadCatalog(root)[0].rootDirectory, '.');
    save({ rootDirectory: 'books/高数 讲义' });
    writeFileSync(join(root, 'second.yaml'), stringify({
      title: 'Exercises', author: 'Author', repository: 'https://github.com/example/books', rootDirectory: 'exercises'
    }));
    assert.deepEqual(loadCatalog(root).map(entry => entry.rootDirectory), ['books/高数 讲义', 'exercises']);
  });
});

test('rejects unsafe, hidden, ignored or ambiguous roots without fetching repositories', () => {
  withCatalog((root, save) => {
    for (const rootDirectory of ['', '/', '/books', '../books', 'books/../other', './books', 'books/', 'a//b',
      'a\\b', 'C:/books', 'https://example.com', '%2e%2e/books', 'books/.git', 'node_modules/books',
      'books/dist', 'books\u0000', ' books', 'books ', null, 12]) {
      save({ rootDirectory });
      assert.throws(() => loadCatalog(root), /rootDirectory/, String(rootDirectory));
    }
  });
});

test('shares structural checks for slugs, blank fields and repository URLs', () => {
  withCatalog((root, save) => {
    for (const fields of [{ title: ' ' }, { author: '' }, { repository: 'https://github.com/a/b?x=1' },
      { repository: 'https://user:secret@github.com/a/b' }, { status: 'draft' }]) {
      save(fields);
      assert.throws(() => loadCatalog(root), /Invalid Catalog entry/);
    }
    save();
    writeFileSync(join(root, 'Bad_Slug.yaml'), '{}');
    assert.throws(() => loadCatalog(root), /Invalid Catalog slug/);
  });
});
