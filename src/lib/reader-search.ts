import { searchBook, type SearchDocument } from './book-search';

export function initializeReaderSearch(root: HTMLElement) {
  const input = root.querySelector<HTMLInputElement>('[data-search-input]');
  const results = root.querySelector<HTMLElement>('[data-search-results]');
  const status = root.querySelector<HTMLElement>('[data-search-status]');
  const retry = root.querySelector<HTMLButtonElement>('[data-search-retry]');
  let index: Promise<SearchDocument[]> | null = null;
  function loadIndex() {
    index ??= fetch(root.dataset.searchUrl ?? '').then(async (response) => {
      if (!response.ok) throw new Error('Search index unavailable');
      return await response.json() as SearchDocument[];
    }).catch((error: unknown) => { index = null; throw error; });
    return index;
  }
  function appendHighlighted(element: HTMLElement, text: string, query: string) {
    const position = text.toLocaleLowerCase().indexOf(query.toLocaleLowerCase());
    if (position < 0) { element.textContent = text; return; }
    const mark = document.createElement('mark');
    mark.textContent = text.slice(position, position + query.length);
    element.append(text.slice(0, position), mark, text.slice(position + query.length));
  }
  async function update() {
    if (!input || !results || !status) return;
    if (retry) retry.hidden = true;
    results.replaceChildren();
    status.textContent = '正在加载本书搜索…';
    try {
      const documents = await loadIndex();
      const query = input.value.trim();
      const matches = searchBook(documents, query);
      const fragment = document.createDocumentFragment();
      for (const match of matches) {
        const link = document.createElement('a');
        link.href = match.href;
        const title = document.createElement('strong');
        appendHighlighted(title, match.title, query);
        const section = document.createElement('span');
        appendHighlighted(section, match.section, query);
        const snippet = document.createElement('p');
        appendHighlighted(snippet, match.snippet, query);
        link.append(title, section, snippet);
        fragment.append(link);
      }
      results.replaceChildren(fragment);
      status.textContent = !query ? '输入关键词，搜索章节标题和正文。' : matches.length === 40 ? '显示前 40 个结果，可增加关键词缩小范围。' : matches.length ? `找到 ${matches.length} 个结果` : `没有找到“${query}”，请尝试其他关键词。`;
    } catch {
      status.textContent = '搜索暂时无法加载。请检查连接后重试，仍可使用目录阅读。';
      if (retry) retry.hidden = false;
    }
  }
  input?.addEventListener('input', () => { void update(); });
  retry?.addEventListener('click', () => { input?.focus(); void update(); });
  return { open: () => { void update(); } };
}
