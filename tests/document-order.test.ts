import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { orderBookDocuments } from '../src/lib/document-order';
import { validateBookRepository } from '../src/lib/repository-validator';

function withRepository(files: Record<string, string>, run: (root: string) => void): void {
  const root = mkdtempSync(join(tmpdir(), 'wiki-order-'));
  try {
    for (const [sourcePath, value] of Object.entries(files)) {
      const path = join(root, sourcePath);
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, value);
    }
    run(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test('uses SUMMARY.md link order and appends unlisted documents', () => {
  withRepository({
    'README.md': '# Book\n',
    'SUMMARY.md': '# Summary\n\n- [Second](chapters/02-second.md)\n- [First][first]\n\n[first]: chapters/01-first.md\n',
    'chapters/01-first.md': '# First\n',
    'chapters/02-second.md': '# Second\n',
    'chapters/03-unlisted.md': '# Unlisted\n'
  }, (root) => {
    const repository = validateBookRepository(root);
    assert.deepEqual(orderBookDocuments(root, repository), [
      'README.md',
      'chapters/02-second.md',
      'chapters/01-first.md',
      'chapters/03-unlisted.md'
    ]);
  });
});

test('uses Markdown links in README lists when SUMMARY.md is absent', () => {
  withRepository({
    'README.md': '# Book\n\nA prose link to [third](chapters/03-third.md).\n\n## Contents\n\n- [Second](chapters/02-second.md#start)\n- [First](chapters/01-first.md)\n',
    'chapters/01-first.md': '# First\n',
    'chapters/02-second.md': '# Second\n',
    'chapters/03-third.md': '# Third\n'
  }, (root) => {
    const repository = validateBookRepository(root);
    assert.deepEqual(orderBookDocuments(root, repository), [
      'README.md',
      'chapters/02-second.md',
      'chapters/01-first.md',
      'chapters/03-third.md'
    ]);
  });
});

test('falls back to normalized path order without navigation links', () => {
  withRepository({
    'guide.md': '# Guide\n',
    'chapters/02-second.md': '# Second\n',
    'chapters/01-first.md': '# First\n'
  }, (root) => {
    const repository = validateBookRepository(root);
    assert.deepEqual(orderBookDocuments(root, repository), [
      'chapters/01-first.md',
      'chapters/02-second.md',
      'guide.md'
    ]);
  });
});
