import { resolve } from 'node:path';
import type { CatalogEntry } from '../lib/catalog-loader';
import { buildLocalBook, type BookMetadata, type BuiltBook, type BuiltDocument } from '../lib/book-builder';
import { getBuiltBooks } from './catalog-data';
import { projectRepository } from './site-data';

export type CatalogBook = CatalogEntry;
export type MarkdownDocument = BuiltDocument;
export type BookModel = BuiltBook;

const includedBooks: BookMetadata[] = [
  {
    slug: 'math-one-exams',
    shortTitle: '数学一',
    contentUnit: '份试卷',
    title: '2010–2026 年数学一真题套卷',
    author: '本地资源',
    description: '2010–2026 年数学一真题，共 17 份试卷。',
    status: 'active'
  },
  {
    slug: 'math-two-exams',
    shortTitle: '数学二',
    contentUnit: '份试卷',
    title: '2010–2026 年数学二真题套卷',
    author: '本地资源',
    description: '2010–2026 年数学二真题，共 17 份试卷。',
    status: 'active'
  }
];

let booksPromise: Promise<BookModel[]> | undefined;

export function getAllBooks(): Promise<BookModel[]> {
  booksPromise ??= Promise.all([
    getBuiltBooks(),
    ...includedBooks.map((metadata) => buildLocalBook(
      metadata,
      resolve(process.cwd(), 'content', metadata.slug),
      (sourcePath) => `${projectRepository}/blob/${process.env.GITHUB_SHA || 'main'}/content/${metadata.slug}/${sourcePath.split('/').map(encodeURIComponent).join('/')}`
    ))
  ]).then(([catalogBooks, ...localBooks]) => [...localBooks, ...catalogBooks]);
  return booksPromise;
}

export const getReadableBooks = getAllBooks;

export async function getBook(slug: string): Promise<BookModel | undefined> {
  return (await getAllBooks()).find((book) => book.catalog.slug === slug);
}
