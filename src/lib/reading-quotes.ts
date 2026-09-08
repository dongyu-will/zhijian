import { fallbackReadingQuotes, type ReadingQuote } from '../data/reading-quotes';

const quoteEndpoint = 'https://v1.hitokoto.cn/?c=k&encode=json&min_length=8&max_length=32';

export function parseHitokotoQuote(value: unknown): ReadingQuote | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const data = value as Record<string, unknown>;
  if (typeof data.hitokoto !== 'string') return undefined;
  const text = data.hitokoto.trim();
  if ([...text].length < 8 || [...text].length > 32 || /[<>\u0000-\u001f]/.test(text)) return undefined;
  const author = typeof data.from_who === 'string' ? data.from_who.trim() : '';
  const source = typeof data.from === 'string' ? data.from.trim() : '';
  if (author.length > 60 || source.length > 100) return undefined;
  const uuid = typeof data.uuid === 'string' && /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(data.uuid) ? data.uuid : undefined;
  return { text, source: [author, source].filter(Boolean).join(' · ') || '一言', ...(uuid && { sourceUrl: `https://hitokoto.cn/?uuid=${uuid}` }) };
}

export function createQuoteDeck() {
  const quotes = [...fallbackReadingQuotes];
  let cursor = 0;
  return {
    next(): ReadingQuote {
      const quote = quotes[cursor];
      cursor = (cursor + 1) % quotes.length;
      return quote;
    },
    add(incoming: ReadingQuote[]): void {
      const seen = new Set(quotes.map((quote) => quote.text));
      const sourceUrls = new Set(quotes.flatMap((quote) => quote.sourceUrl ? [quote.sourceUrl] : []));
      const unique = incoming.filter((quote) => {
        if (seen.has(quote.text) || (quote.sourceUrl && sourceUrls.has(quote.sourceUrl))) return false;
        seen.add(quote.text);
        if (quote.sourceUrl) sourceUrls.add(quote.sourceUrl);
        return true;
      });
      quotes.splice(cursor, 0, ...unique);
    }
  };
}

/** One bounded prefetch per visit; animation never makes network requests. */
export async function loadRemoteQuotes(onQuotes: (quotes: ReadingQuote[]) => void): Promise<void> {
  const cacheKey = 'wiki-home-quotes-v1';
  try {
    const cached = JSON.parse(localStorage.getItem(cacheKey) ?? 'null');
    if (cached && typeof cached.savedAt === 'number' && Date.now() - cached.savedAt >= 0 && Date.now() - cached.savedAt < 3_600_000 && Array.isArray(cached.responses)) {
      const quotes = cached.responses.slice(0, 4).map(parseHitokotoQuote).filter((quote: ReadingQuote | undefined): quote is ReadingQuote => !!quote);
      if (quotes.length) { onQuotes(quotes); return; }
    }
  } catch {
    // Storage is optional; original copy is always available.
  }
  const responses: unknown[] = [];
  for (let request = 0; request < 4; request += 1) {
    if (request > 0) await new Promise((resolve) => setTimeout(resolve, 2200));
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    try {
      const response = await fetch(quoteEndpoint, { signal: controller.signal, credentials: 'omit', referrerPolicy: 'no-referrer' });
      if (!response.ok) break;
      const data: unknown = await response.json();
      const quote = parseHitokotoQuote(data);
      if (quote) {
        responses.push({ hitokoto: quote.text, from: quote.source, uuid: quote.sourceUrl?.split('uuid=')[1] });
        onQuotes([quote]);
      }
    } catch {
      break;
    } finally {
      clearTimeout(timeout);
    }
  }
  if (responses.length) {
    try { localStorage.setItem(cacheKey, JSON.stringify({ savedAt: Date.now(), responses })); } catch { /* No storage requirement. */ }
  }
}
