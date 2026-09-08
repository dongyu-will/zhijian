import assert from 'node:assert/strict';
import test from 'node:test';
import { renderRepositoryDocument } from '../src/lib/markdown-renderer';
import { searchBook, type SearchDocument } from '../src/lib/book-search';

test('short result labels preserve matching against the full original document title', () => {
  const results = searchBook([{ title: '2011 年全国硕士研究生招生考试数学二真题', displayTitle: '数学二 · 2011', href: '/wiki/books/math2/2011/', sections: [{ id: '第-23-题', title: '第 23 题', text: '特征值问题' }] }], '全国硕士研究生');
  assert.equal(results[0].title, '数学二 · 2011');
  assert.equal(results[0].href, '/wiki/books/math2/2011/');
});

test('search sections share rendered heading IDs and exclude source annotations and formula markup', async () => {
  const rendered = await renderRepositoryDocument('# 真题\n\n<!-- source: private.pdf; PDF 第 276 页 -->\n\n## 选择题\n\n### 5.\n\n矩阵有三个不同的特征值。$\\frac{1}{2}$\n\n### 5.\n\n重复题号测试。\n\n<h3>附录</h3>\n\n补充资料。', {
    sourcePath: 'chapters/2022.md', entryDocument: 'README.md', documentPaths: ['README.md', 'chapters/2022.md'], bookBase: '/wiki/books/demo', assetBase: '/wiki/book-assets/demo'
  });
  assert.deepEqual(rendered.searchSections.map((section) => section.id), rendered.headings.map((heading) => heading.id));
  const text = rendered.searchSections.map((section) => section.text).join(' ');
  assert.match(text, /特征值/);
  assert.doesNotMatch(text, /source:|private\.pdf|276|frac|<h3>/);
  assert.ok(rendered.searchSections.some((section) => section.id === '5-2'));
});

test('search shows matching context and navigates to the exact section under a base path', () => {
  const documents: SearchDocument[] = [{ title: '2022 年真题', href: '/wiki/books/demo/chapters/2022/', sections: [
    { id: 'intro', title: '说明', text: '这是不相关的介绍。' },
    { id: '第5题', title: '5.', text: '开头内容。'.repeat(30) + '矩阵有三个不同的特征值。' + '后续内容。'.repeat(30) }
  ] }];
  const results = searchBook(documents, ' 特征值 ');
  assert.equal(results.length, 1);
  assert.equal(results[0].href, '/wiki/books/demo/chapters/2022/#%E7%AC%AC5%E9%A2%98');
  assert.match(results[0].snippet, /特征值/);
  assert.ok(results[0].snippet.length < 140);
  assert.doesNotMatch(results[0].snippet, /不相关/);
  assert.deepEqual(searchBook(documents, '不存在的词'), []);
  assert.deepEqual(searchBook(documents, '  '), []);
  assert.equal(searchBook(documents, '2022')[0].href, documents[0].href);
});

test('search limits a common query without interpreting literal source text', () => {
  const documents: SearchDocument[] = [{ title: '教材', href: '/books/demo/', sections: Array.from({ length: 60 }, (_, index) => ({ id: String(index), title: `章节 ${index}`, text: 'literal <img onerror=alert(1)> 关键词' })) }];
  const matches = searchBook(documents, '关键词');
  assert.equal(matches.length, 40);
  assert.match(matches[0].snippet, /<img/);
});
