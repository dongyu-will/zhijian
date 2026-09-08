import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import test from 'node:test';
import { buildLocalBook } from '../src/lib/book-builder';

test('bundled Markdown builds with source links and images without a PDF or remote clone', async () => {
  const root = mkdtempSync(join(tmpdir(), 'studyloom-local-'));
  const slug = basename(root);
  const assets = resolve('public/book-assets', slug);
  try {
    writeFileSync(join(root, 'README.md'), '# Notes\n\n[Read](notes.md)');
    writeFileSync(join(root, 'notes.md'), '# A normal article\n\n![Diagram](diagram.svg)');
    writeFileSync(join(root, 'diagram.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>');
    const book = await buildLocalBook({ slug, title: 'Notes', author: 'Author', status: 'active' }, root, path => `https://github.com/example/site/blob/revision/content/${path}`);
    assert.equal(book.origin, 'local');
    assert.equal(book.sourcePdfUrl, null);
    assert.equal(book.documents.length, 2);
    assert.equal(book.documents[1].sourceUrl, 'https://github.com/example/site/blob/revision/content/notes.md');
    assert.match(book.documents[1].html, /book-assets\/studyloom-local-[^/]+\/diagram.svg/);
    assert.equal(existsSync(join(assets, 'diagram.svg')), true);
    assert.equal(readFileSync(join(assets, 'notes.md'), 'utf8').startsWith('# A normal article'), true);
  } finally {
    rmSync(root, { recursive: true, force: true });
    rmSync(assets, { recursive: true, force: true });
  }
});
