import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveReadingLocation } from '../src/lib/reading-location';

const origin = 'https://example.com';
const roots = ['/wiki/books/calculus/', '/wiki/books/template/'];

test('resumes a known book with its base path, query and section', () => {
  assert.deepEqual(resolveReadingLocation({ href: '/wiki/books/calculus/limits/?view=read#definition', title: '极限' }, origin, roots), {
    href: '/wiki/books/calculus/limits/?view=read#definition', title: '极限'
  });
  assert.deepEqual(resolveReadingLocation({ href: `${origin}/wiki/books/template/` }, origin, roots), {
    href: '/wiki/books/template/', title: ''
  });
});

test('does not expose a resume link for missing, malformed or removed books', () => {
  for (const saved of [null, false, 'text', {}, { href: 123 }, { href: '' },
    { href: '/wiki/books/removed/' }, { href: '/wiki/books/calculus-other/' }, { href: '/books/calculus/' }]) {
    assert.equal(resolveReadingLocation(saved, origin, roots), null);
  }
});

test('rejects external links, script schemes, credentials and traversal outside registered books', () => {
  for (const href of ['javascript:alert(1)', '//other.example/wiki/books/calculus/',
    'https://other.example/wiki/books/calculus/', 'https://user:password@example.com/wiki/books/calculus/',
    '/wiki/books/calculus/../../admin/', '/wiki/books/calculus/%2e%2e/removed/']) {
    assert.equal(resolveReadingLocation({ href }, origin, roots), null, href);
  }
});

test('ignores non-string titles and supports a site deployed at root', () => {
  assert.deepEqual(resolveReadingLocation({ href: '/books/calculus/', title: 1 }, origin, ['/books/calculus/']), {
    href: '/books/calculus/', title: ''
  });
});
