import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { validateBookRepository } from '../src/lib/repository-validator';

type FixtureFile = string | Buffer | { symlink: string };

function withRepository(files: Record<string, FixtureFile>, run: (root: string) => void): void {
  const root = mkdtempSync(join(tmpdir(), 'wiki-validator-'));
  try {
    for (const [sourcePath, value] of Object.entries(files)) {
      const path = join(root, sourcePath);
      mkdirSync(dirname(path), { recursive: true });
      if (typeof value === 'object' && !Buffer.isBuffer(value)) symlinkSync(value.symlink, path);
      else writeFileSync(path, value);
    }
    run(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test('accepts a conventional Markdown repository without warnings', () => {
  withRepository({
    'README.md': '# Example book\n\nRead [chapter one](chapters/01-one.md).\n',
    'chapters/01-one.md': '---\ntitle: One\n---\n\n# Chapter one\n\n![Diagram](../assets/diagram.svg)\n',
    'SUMMARY.md': '# Navigation control\n',
    'assets/diagram.svg': '<svg xmlns="http://www.w3.org/2000/svg"></svg>'
  }, (root) => {
    assert.deepEqual(validateBookRepository(root), {
      entryDocument: 'README.md',
      markdownFiles: ['README.md', 'chapters/01-one.md'],
      sourceFiles: ['README.md', 'SUMMARY.md', 'assets/diagram.svg', 'chapters/01-one.md'],
      warnings: []
    });
  });
});

test('uses the first Markdown path when README.md is absent', () => {
  withRepository({ 'guide.md': '# Guide\n' }, (root) => {
    const validated = validateBookRepository(root);
    assert.equal(validated.entryDocument, 'guide.md');
    assert.match(validated.warnings.join('\n'), /no root entry document/);
  });
});

test('accepts documents without a level-one heading', () => {
  withRepository({
    'README.md': 'Introductory paragraph without a heading.\n',
    'chapter.md': 'Another plain document.\n'
  }, (root) => {
    assert.equal(validateBookRepository(root).markdownFiles.length, 2);
  });
});

test('reports missing relative targets as warnings', () => {
  withRepository({
    'README.md': '# Example book\n\n[Missing](missing.md)\n\n![Missing](assets/missing.png)\n'
  }, (root) => {
    const warnings = validateBookRepository(root).warnings.join('\n');
    assert.match(warnings, /link target does not exist/);
    assert.match(warnings, /image target does not exist/);
  });
});

test('allows external images', () => {
  withRepository({
    'README.md': '# Example book\n\n![Remote](https://example.com/image.png)\n'
  }, (root) => {
    assert.deepEqual(validateBookRepository(root).warnings, []);
  });
});

test('reports references that escape the repository as warnings', () => {
  withRepository({
    'README.md': '# Example book\n\n[Outside](../outside.md)\n'
  }, (root) => {
    assert.match(validateBookRepository(root).warnings.join('\n'), /points outside the repository/);
  });
});

test('skips symbolic links without reading or publishing them', () => {
  withRepository({
    'README.md': '# Example book\n',
    'leak.md': { symlink: '/etc/hosts' }
  }, (root) => {
    const validated = validateBookRepository(root);
    assert.deepEqual(validated.markdownFiles, ['README.md']);
    assert.match(validated.warnings.join('\n'), /leak\.md: symbolic link was skipped/);
  });
});

test('rejects Markdown that is not valid UTF-8', () => {
  withRepository({
    'README.md': '# Example book\n',
    'invalid.md': Buffer.from([0xc3, 0x28])
  }, (root) => {
    assert.throws(() => validateBookRepository(root), /invalid\.md: file must be valid UTF-8/);
  });
});

test('rejects a repository without Markdown', () => {
  withRepository({ 'asset.txt': 'No Markdown here.\n' }, (root) => {
    assert.throws(() => validateBookRepository(root), /at least one Markdown document/);
  });
});
