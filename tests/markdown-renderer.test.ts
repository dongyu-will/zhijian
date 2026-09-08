import assert from 'node:assert/strict';
import test from 'node:test';
import { renderRepositoryDocument, renderRepositoryMarkdown, stripLeadingDocumentHeading, type RepositoryMarkdownOptions } from '../src/lib/markdown-renderer';

const options: RepositoryMarkdownOptions = {
  sourcePath: 'chapters/current.md',
  entryDocument: 'README.md',
  documentPaths: [
    'README.md',
    'chapters/current.md',
    'chapters/next.md',
    'appendix/README.md'
  ],
  bookBase: '/wiki/books/demo',
  assetBase: '/wiki/book-assets/demo'
};

test('rewrites Markdown document links to reader routes', async () => {
  const html = await renderRepositoryMarkdown([
    '[Sibling](next.md?mode=raw#part)',
    '[Entry](../README.md#top)',
    '[Extensionless](next)',
    '[Directory](../appendix/)',
    '[Root relative](/chapters/next.md)'
  ].join('\n\n'), options);

  assert.match(html, /href="\/wiki\/books\/demo\/chapters\/next\/\?mode=raw#part"/);
  assert.match(html, /href="\/wiki\/books\/demo\/#top"/);
  assert.match(html, /href="\/wiki\/books\/demo\/chapters\/next\/"/);
  assert.match(html, /href="\/wiki\/books\/demo\/appendix\/README\/"/);
});

test('resolves images and attachments from the repository root', async () => {
  const html = await renderRepositoryMarkdown([
    '[Attachment](../files/guide%201.pdf?download=1#page=2)',
    '![Diagram](../images/%E5%9B%BE%201.png)',
    '<img src="../images/raw.png" alt="Raw image">'
  ].join('\n\n'), options);

  assert.match(html, /href="\/wiki\/book-assets\/demo\/files\/guide%201.pdf\?download=1#page=2"/);
  assert.match(html, /src="\/wiki\/book-assets\/demo\/images\/%E5%9B%BE%201.png"/);
  assert.match(html, /src="\/wiki\/book-assets\/demo\/images\/raw.png"/);
  assert.doesNotMatch(html, /chapters\/files|chapters\/images/);
});

test('derives the section map from the same rendered heading tree', async () => {
  const rendered = await renderRepositoryDocument([
    '# Linked [Title](next.md)',
    '',
    'Setext section',
    '---',
    '',
    '## Repeat',
    '',
    '## Repeat',
    '',
    '```md',
    '# Not a heading',
    '```',
    '',
    '<h3>Raw <em>heading</em></h3>'
  ].join('\n'), options);

  assert.deepEqual(rendered.headings, [
    { id: 'linked-title', title: 'Linked Title', level: 1 },
    { id: 'setext-section', title: 'Setext section', level: 2 },
    { id: 'repeat', title: 'Repeat', level: 2 },
    { id: 'repeat-2', title: 'Repeat', level: 2 },
    { id: 'raw-heading', title: 'Raw heading', level: 3 }
  ]);
  for (const heading of rendered.headings) assert.match(rendered.html, new RegExp(`id="${heading.id}"`));
  assert.doesNotMatch(rendered.html, /id="not-a-heading"/);
});

test('only strips a matching level-one heading at the start of rendered content', () => {
  const leading = stripLeadingDocumentHeading('<h1 id="title">Title</h1><p>Body</p>', 'Title');
  assert.deepEqual(leading, { html: '<p>Body</p>', stripped: true });

  const later = stripLeadingDocumentHeading('<p>Introduction</p><h1 id="title">Title</h1>', 'Title');
  assert.deepEqual(later, { html: '<p>Introduction</p><h1 id="title">Title</h1>', stripped: false });
});

test('preserves external, fragment, and escaping references', async () => {
  const html = await renderRepositoryMarkdown([
    '[External](https://example.com/docs)',
    '[Email](mailto:reader@example.com)',
    '[Section](#part)',
    '[Outside](../../../outside.pdf)',
    '![Remote](https://example.com/image.png)'
  ].join('\n\n'), options);

  assert.match(html, /href="https:\/\/example.com\/docs"/);
  assert.match(html, /href="mailto:reader@example.com"/);
  assert.match(html, /href="#part"/);
  assert.match(html, /href="\.\.\/\.\.\/\.\.\/outside.pdf"/);
  assert.match(html, /src="https:\/\/example.com\/image.png"/);
});
