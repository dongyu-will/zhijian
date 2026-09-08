import type { BuiltBook, BuiltDocument } from './book-builder';

export function bookContents(book: Pick<BuiltBook, 'documents' | 'entryDocument'>): BuiltDocument[] {
  const contents = book.documents.filter((item) => item.sourcePath !== book.entryDocument.sourcePath);
  return contents.length ? contents : book.documents;
}

export function readingTitle(book: Pick<BuiltBook, 'catalog' | 'entryDocument'>, document: Pick<BuiltDocument, 'sourcePath' | 'title' | 'navigationTitle'>): string {
  const label = document.navigationTitle ?? document.title;
  if (!book.catalog.shortTitle) return label;
  return document.sourcePath === book.entryDocument.sourcePath ? book.catalog.shortTitle : `${book.catalog.shortTitle} · ${label}`;
}
