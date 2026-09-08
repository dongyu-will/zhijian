import { getAllBooks } from '../data/book-data';
import { bookContents } from '../lib/book-presentation';

export const prerender = true;

export async function GET() {
  const books = await getAllBooks();
  const siteBase = import.meta.env.BASE_URL.replace(/\/$/, '');
  const index = books.map((book) => ({
    slug: book.catalog.slug,
    title: book.catalog.title,
    author: book.catalog.author,
    description: book.catalog.description ?? '',
    chapters: bookContents(book).length,
    stars: book.stars,
    href: `${siteBase}/books/${book.catalog.slug}/`
  }));
  return new Response(JSON.stringify(index), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}
