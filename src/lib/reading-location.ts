export type ReadingLocation = { href: string; title: string; displayTitle?: string };

export function resolveReadingLocation(saved: unknown, origin: string, bookRoots: string[]): ReadingLocation | null {
  if (!saved || typeof saved !== 'object' || !('href' in saved) || typeof saved.href !== 'string') return null;
  try {
    const url = new URL(saved.href, origin);
    if (url.origin !== origin || url.username || url.password || !bookRoots.some((root) => url.pathname.startsWith(root))) return null;
    return {
      href: `${url.pathname}${url.search}${url.hash}`,
      title: 'title' in saved && typeof saved.title === 'string' ? saved.title : '',
      ...('displayTitle' in saved && typeof saved.displayTitle === 'string' && saved.displayTitle.trim() ? { displayTitle: saved.displayTitle } : {})
    };
  } catch {
    return null;
  }
}
