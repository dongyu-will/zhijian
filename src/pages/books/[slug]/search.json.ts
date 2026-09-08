import type { APIRoute } from 'astro';
import { getReadableBooks } from '../../../data/book-data';
import type { BuiltBook } from '../../../lib/book-builder';
import type { SearchDocument } from '../../../lib/book-search';
import { readingTitle } from '../../../lib/book-presentation';

export async function getStaticPaths() {
  return (await getReadableBooks()).map((book) => ({ params: { slug: book.catalog.slug }, props: { book } }));
}

export const GET: APIRoute = ({ props }) => {
  const book = props.book as BuiltBook;
  const base = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/books/${book.catalog.slug}`;
  const index: SearchDocument[] = book.documents.map((document) => ({
    title: document.title,
    displayTitle: readingTitle(book, document),
    href: document === book.entryDocument ? `${base}/` : `${base}/${document.sourcePath.replace(/\.(?:md|markdown)$/i, '').split('/').map(encodeURIComponent).join('/')}/`,
    sections: document.searchSections
  }));
  return new Response(JSON.stringify(index), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
