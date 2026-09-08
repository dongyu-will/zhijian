import assert from 'node:assert/strict';
import test from 'node:test';
import { renderRepositoryDocument } from '../src/lib/markdown-renderer';

const options = { sourcePath: 'chapters/2011.md', entryDocument: 'README.md', documentPaths: ['README.md', 'chapters/2011.md'], bookBase: '/wiki/books/math2', assetBase: '/wiki/book-assets/math2', sourcePdfFilename: 'exam.pdf' };

test('source page links follow rendered question IDs and section starts', async () => {
  const rendered = await renderRepositoryDocument('# 试卷\n\n## 一、选择题\n\n<!-- source: exam.pdf; PDF 第 24 页 -->\n\n### 第 1 题\n\n正文。\n\n<!-- source: exam.pdf; PDF 第 25 页 -->\n\n### 第 2 题\n\n正文。\n\n## 二、填空题\n\n<!-- source: exam.pdf; PDF 第 32 页 -->\n\n### 第 9 题\n\n正文。', options);
  assert.deepEqual(rendered.headings.map(({ title, sourcePdfPage }) => [title, sourcePdfPage]), [['试卷', 24], ['一、选择题', 24], ['第 1 题', 24], ['第 2 题', 25], ['二、填空题', 32], ['第 9 题', 32]]);
  assert.ok(rendered.headings.some(h => h.id === '第-2-题' && h.sourcePdfPage === 25));
  assert.doesNotMatch(rendered.html, /<!-- source:/);
});

test('code examples, other PDFs, invalid pages and raw attributes cannot invent source links', async () => {
  const rendered = await renderRepositoryDocument('```html\n<!-- source: exam.pdf; PDF 第 99 页 -->\n```\n\n<!-- source: other.pdf; PDF 第 98 页 -->\n\n<!-- source: exam.pdf; PDF 第 0 页 -->\n\n<h3 data-source-page="97">说明</h3>', options);
  assert.equal(rendered.headings[0].sourcePdfPage, undefined);
  assert.doesNotMatch(rendered.html, /data-source-page/);
});
