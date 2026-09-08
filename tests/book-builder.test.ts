import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { buildCatalog, type RepositoryBuildDependencies } from '../src/lib/book-builder';
import type { CatalogEntry } from '../src/lib/catalog-loader';

type Harness = {
  entry: (rootDirectory: string, overrides?: Partial<CatalogEntry>) => CatalogEntry;
  dependencies: RepositoryBuildDependencies;
  destinations: string[];
  starRequests: string[];
  assetRoot: (entry: CatalogEntry) => string;
};

async function withRepository(run: (harness: Harness) => Promise<void>): Promise<void> {
  const root = mkdtempSync(join(tmpdir(), 'wiki-builder-test-'));
  const entries: CatalogEntry[] = [];
  const destinations: string[] = [];
  const starRequests: string[] = [];
  const previousMode = process.env.NODE_ENV;
  const previousBase = process.env.PUBLIC_BASE_PATH;
  const files = {
    'README.md': '# Repository introduction',
    'private.md': '# Not part of either book',
    'shared.svg': '<svg>shared</svg>',
    'books/a/README.md': '# Book A\n\n[Chapter](chapters/one.md)\n\n[Outside](../../private.md)',
    'books/a/chapters/one.md': '# One\n\n[Home](../README.md)\n\n![Figure](../assets/figure.svg)\n\n[Download](/assets/data.txt)',
    'books/a/assets/figure.svg': '<svg>A</svg>',
    'books/a/assets/data.txt': 'A data',
    'books/a/.hidden/secret.txt': 'hidden',
    'books/b/README.md': '# Book B\n\n[Next](two.md)',
    'books/b/two.md': '# Two\n\n![Figure](assets/figure.svg)',
    'books/b/assets/figure.svg': '<svg>B</svg>',
    'empty/asset.txt': 'No Markdown'
  };
  try {
    for (const [path, value] of Object.entries(files)) {
      mkdirSync(dirname(join(root, path)), { recursive: true });
      writeFileSync(join(root, path), value);
    }
    symlinkSync('../../shared.svg', join(root, 'books/a/leak.svg'));
    process.env.NODE_ENV = 'production';
    process.env.PUBLIC_BASE_PATH = '/wiki';
    await run({
      entry(rootDirectory, overrides = {}) {
        const entry: CatalogEntry = {
          slug: `${basename(root)}-${entries.length}`, title: `Book ${entries.length}`, author: 'Test',
          repository: 'https://github.com/example/books', rootDirectory, status: 'active', ...overrides
        };
        entries.push(entry);
        return entry;
      },
      dependencies: {
        cloneRepository(repository, destination) {
          destinations.push(destination);
          cpSync(root, destination, { recursive: true });
          return { repository, localPath: destination, defaultBranch: 'main', commitSha: 'test-sha' };
        },
        async fetchStars(repository) {
          starRequests.push(repository);
          return 7;
        }
      },
      destinations,
      starRequests,
      assetRoot(entry) { return resolve('public/book-assets', entry.slug); }
    });
  } finally {
    if (previousMode === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousMode;
    if (previousBase === undefined) delete process.env.PUBLIC_BASE_PATH;
    else process.env.PUBLIC_BASE_PATH = previousBase;
    rmSync(root, { recursive: true, force: true });
    for (const entry of entries) rmSync(resolve('public/book-assets', entry.slug), { recursive: true, force: true });
  }
}

test('builds isolated books from one snapshot, retaining source prefixes but not reader prefixes', async () => {
  await withRepository(async ({ entry, dependencies, destinations, starRequests, assetRoot }) => {
    const a = entry('books/a');
    const b = entry('books/b', { repository: 'https://github.com/Example/Books.git/' });
    const books = await buildCatalog([a, b, entry('missing', { status: 'blocked' })], dependencies);
    assert.equal(destinations.length, 1);
    assert.equal(starRequests.length, 1);
    assert.deepEqual(books.map(book => book.commitSha), ['test-sha', 'test-sha']);
    assert.deepEqual(books.map(book => book.stars), [7, 7]);
    assert.deepEqual(books[0].documents.map(doc => doc.sourcePath), ['README.md', 'chapters/one.md']);
    assert.deepEqual(books[1].documents.map(doc => doc.sourcePath), ['README.md', 'two.md']);
    const chapter = books[0].documents[1];
    assert.equal(chapter.sourceUrl, 'https://github.com/example/books/blob/main/books/a/chapters/one.md');
    assert.ok(books[0].entryDocument.html.includes(`/wiki/books/${a.slug}/chapters/one/`));
    assert.ok(chapter.html.includes(`/wiki/books/${a.slug}/`));
    assert.ok(chapter.html.includes(`/wiki/book-assets/${a.slug}/assets/figure.svg`));
    assert.ok(chapter.html.includes(`/wiki/book-assets/${a.slug}/assets/data.txt`));
    assert.equal(readFileSync(join(assetRoot(a), 'assets/figure.svg'), 'utf8'), '<svg>A</svg>');
    assert.equal(readFileSync(join(assetRoot(b), 'assets/figure.svg'), 'utf8'), '<svg>B</svg>');
    for (const excluded of ['books', 'private.md', 'shared.svg', 'leak.svg', '.hidden']) {
      assert.equal(existsSync(join(assetRoot(a), excluded)), false, excluded);
    }
    assert.equal(existsSync(dirname(destinations[0])), false, 'session cleaned after success');
    await buildCatalog([a], dependencies);
    assert.equal(destinations.length, 2, 'a new build does not reuse a stale snapshot');
  });
});

test('root books keep existing routes and source URLs', async () => {
  await withRepository(async ({ entry, dependencies }) => {
    const catalog = entry('.');
    const [book] = await buildCatalog([catalog], dependencies);
    assert.equal(book.entryDocument.sourcePath, 'README.md');
    assert.equal(book.entryDocument.sourceUrl, 'https://github.com/example/books/blob/main/README.md');
    assert.ok(book.documents.some(doc => doc.sourcePath === 'books/b/two.md'));
  });
});

test('invalid roots and empty books fail production with context and clean temporary clones', async () => {
  await withRepository(async ({ entry, dependencies, destinations }) => {
    for (const rootDirectory of ['missing', 'empty', '../outside']) {
      const catalog = entry(rootDirectory);
      await assert.rejects(buildCatalog([catalog], dependencies), (error: Error) => {
        assert.ok(error.message.includes(catalog.title));
        assert.ok(error.message.includes('https://github.com/example/books'));
        assert.ok(error.message.includes(`rootDirectory=${rootDirectory}`));
        return true;
      });
      assert.equal(existsSync(dirname(destinations.at(-1)!)), false);
    }
  });
});

test('development skips invalid roots but reuses the snapshot for valid siblings', async () => {
  await withRepository(async ({ entry, dependencies, destinations }) => {
    process.env.NODE_ENV = 'development';
    const good = entry('books/b');
    const books = await buildCatalog([entry('missing'), good], dependencies);
    assert.deepEqual(books.map(book => book.catalog.slug), [good.slug]);
    assert.equal(destinations.length, 1);
  });
});

test('failed clones are reused only within a build and cleaned even on production failure', async () => {
  await withRepository(async ({ entry, dependencies }) => {
    let attempts = 0;
    let destination = '';
    const failing = { ...dependencies, cloneRepository(_repository: string, path: string): never {
      attempts += 1;
      destination = path;
      throw new Error('fixture clone failure');
    } };
    process.env.NODE_ENV = 'development';
    assert.deepEqual(await buildCatalog([entry('books/a'), entry('books/b')], failing), []);
    assert.equal(attempts, 1);
    assert.equal(existsSync(dirname(destination)), false);
    process.env.NODE_ENV = 'production';
    await assert.rejects(buildCatalog([entry('books/a')], failing), /clone failed.*fixture clone failure/);
    assert.equal(attempts, 2);
    assert.equal(existsSync(dirname(destination)), false);
  });
});
