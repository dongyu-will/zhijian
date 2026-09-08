export type SearchSection = { id: string; title: string; text: string };
export type SearchDocument = { title: string; displayTitle?: string; href: string; sections: SearchSection[] };
export type SearchResult = { title: string; section: string; href: string; snippet: string };

export function searchBook(documents: SearchDocument[], query: string, limit = 40): SearchResult[] {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return [];
  const results: SearchResult[] = [];
  for (const document of documents) {
    const titleMatches = document.title.toLocaleLowerCase().includes(needle) || Boolean(document.displayTitle?.toLocaleLowerCase().includes(needle));
    for (const section of document.sections) {
      const position = section.text.toLocaleLowerCase().indexOf(needle);
      if (position < 0 && !section.title.toLocaleLowerCase().includes(needle)) continue;
      const start = Math.max(0, position - 45);
      const end = Math.min(section.text.length, Math.max(0, position) + needle.length + 85);
      results.push({ title: document.displayTitle ?? document.title, section: section.title, href: `${document.href}${section.id ? `#${encodeURIComponent(section.id)}` : ''}`, snippet: `${start ? '…' : ''}${section.text.slice(start, end)}${end < section.text.length ? '…' : ''}` });
      if (results.length >= limit) return results;
    }
    if (titleMatches && !results.some((result) => result.href.split('#')[0] === document.href)) {
      results.push({ title: document.displayTitle ?? document.title, section: '', href: document.href, snippet: document.sections[0]?.text.slice(0, 130) ?? '' });
      if (results.length >= limit) return results;
    }
  }
  return results;
}
