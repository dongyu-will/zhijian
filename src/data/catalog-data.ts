import { loadCatalog } from '../lib/catalog-loader';
import { buildCatalog, type BuiltBook } from '../lib/book-builder';

let booksPromise: Promise<BuiltBook[]> | undefined;

export function getBuiltBooks(): Promise<BuiltBook[]> {
  booksPromise ??= buildCatalog(loadCatalog());
  return booksPromise;
}
