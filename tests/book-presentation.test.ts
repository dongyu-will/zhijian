import assert from 'node:assert/strict';
import test from 'node:test';
import { bookContents, readingTitle } from '../src/lib/book-presentation';
import type { BuiltDocument } from '../src/lib/book-builder';

function document(sourcePath: string, title = sourcePath, navigationTitle?: string): BuiltDocument {
  return { sourcePath, title, navigationTitle, sourceMarkdown: '', sourcePdfPages: [], html: '', headings: [], sourceUrl: null, searchText: '', searchSections: [] };
}

test('reading totals exclude the entry by path without losing a single-document publication', () => {
  const entry = document('README.md');
  const first = document('chapters/2010.md');
  const second = document('chapters/2011.md');
  assert.deepEqual(bookContents({ entryDocument: { ...entry }, documents: [entry, first, second] }), [first, second]);
  assert.deepEqual(bookContents({ entryDocument: entry, documents: [entry] }), [entry]);
});

test('compact reading labels retain book identity and fall back to authored titles', () => {
  const book = { catalog: { slug: 'math2', title: '2010–2026 年数学二真题套卷', author: '本地资源', status: 'active' as const, shortTitle: '数学二' }, entryDocument: document('README.md') };
  assert.equal(readingTitle(book, document('chapters/2010.md', '2010 年完整考试名称', '2010')), '数学二 · 2010');
  assert.equal(readingTitle(book, book.entryDocument), '数学二');
  assert.equal(readingTitle({ ...book, catalog: { ...book.catalog, shortTitle: undefined } }, document('chapter.md', '任意章节')), '任意章节');
});
