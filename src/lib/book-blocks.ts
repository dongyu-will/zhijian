type MarkdownNode = {
  type?: string;
  lang?: string | null;
  meta?: string | null;
  value?: string;
  children?: MarkdownNode[];
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character] ?? character);
}

function parseAttributes(value: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  for (const match of value.matchAll(/([\w-]+)=(?:"([^"]*)"|'([^']*)'|([^\s]+))/g)) {
    attributes[match[1]] = match[2] ?? match[3] ?? match[4] ?? '';
  }
  return attributes;
}

function renderCallout(value: string, meta: string): string {
  const attributes = parseAttributes(meta);
  const variant = attributes.type ?? 'note';
  const title = attributes.title ?? '提示';
  return `<blockquote class="book-callout book-callout--${escapeHtml(variant)}"><p class="book-callout-title"><strong>${escapeHtml(title)}</strong></p><p>${escapeHtml(value.trim()).replace(/\r?\n/g, '<br>')}</p></blockquote>`;
}

type FlowNode = { id: string; label: string; tag?: string };

function renderFlowchart(value: string): string | null {
  const nodes = new Map<string, FlowNode>();
  const edges: Array<[string, string]> = [];
  let direction = 'TB';
  let title = '';

  for (const rawLine of value.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const directionMatch = /^direction\s+(TB|LR)$/i.exec(line);
    if (directionMatch) { direction = directionMatch[1].toUpperCase(); continue; }
    const titleMatch = /^title\s+"([^"]+)"$/i.exec(line);
    if (titleMatch) { title = titleMatch[1]; continue; }
    const nodeMatch = /^node\s+(\S+)\s+"([^"]+)"(?:\s+tag="([^"]+)")?$/i.exec(line);
    if (nodeMatch) {
      nodes.set(nodeMatch[1], { id: nodeMatch[1], label: nodeMatch[2], tag: nodeMatch[3] });
      continue;
    }
    const edgeMatch = /^edge\s+(\S+)\s*->\s*(\S+)$/i.exec(line);
    if (edgeMatch) edges.push([edgeMatch[1], edgeMatch[2]]);
  }
  if (!nodes.size) return null;

  const incoming = new Map<string, number>();
  const outgoing = new Map<string, string[]>();
  for (const id of nodes.keys()) { incoming.set(id, 0); outgoing.set(id, []); }
  for (const [from, to] of edges) {
    if (!nodes.has(from) || !nodes.has(to)) continue;
    incoming.set(to, (incoming.get(to) ?? 0) + 1);
    outgoing.get(from)?.push(to);
  }

  const levels = new Map<string, number>();
  const queue: Array<[string, number]> = [...nodes.keys()]
    .filter((id) => incoming.get(id) === 0)
    .map((id) => [id, 0]);
  while (queue.length) {
    const [id, level] = queue.shift()!;
    if (levels.has(id)) continue;
    levels.set(id, level);
    for (const next of outgoing.get(id) ?? []) queue.push([next, level + 1]);
  }
  for (const id of nodes.keys()) if (!levels.has(id)) levels.set(id, 0);

  const grouped = new Map<number, FlowNode[]>();
  for (const node of nodes.values()) {
    const level = levels.get(node.id) ?? 0;
    grouped.set(level, [...(grouped.get(level) ?? []), node]);
  }
  const maxLevel = Math.max(...grouped.keys());
  const levelMarkup = [...Array(maxLevel + 1)].map((_, level) => {
    const items = (grouped.get(level) ?? []).map((node) => `<div class="book-flowchart-node"><span>${escapeHtml(node.label)}</span>${node.tag ? `<small>${escapeHtml(node.tag)}</small>` : ''}</div>`).join('');
    const arrow = level < maxLevel ? `<div class="book-flowchart-arrow" aria-hidden="true">${direction === 'LR' ? '→' : '↓'}</div>` : '';
    return `<div class="book-flowchart-level">${items}</div>${arrow}`;
  }).join('');
  const directionClass = direction === 'LR' ? ' book-flowchart--lr' : '';
  return `<figure class="book-flowchart${directionClass}">${title ? `<figcaption>${escapeHtml(title)}</figcaption>` : ''}<div class="book-flowchart-body">${levelMarkup}</div></figure>`;
}

function renderFunctionPlot(value: string): string | null {
  try {
    const config = JSON.parse(value) as Record<string, unknown>;
    if (!Array.isArray(config.data) && !Array.isArray(config.functions)) return null;
    return `<div class="book-function-plot"><code>${escapeHtml(JSON.stringify(config))}</code></div>`;
  } catch {
    return null;
  }
}

function renderBookBlock(node: MarkdownNode): MarkdownNode | null {
  if (node.type !== 'code' || !node.lang) return null;
  const value = node.value ?? '';
  const html = node.lang === 'callout'
    ? renderCallout(value, node.meta ?? '')
    : node.lang === 'flowchart'
      ? renderFlowchart(value)
      : node.lang === 'function-plot'
        ? renderFunctionPlot(value)
        : null;
  return html ? { type: 'html', value: html } : null;
}

export function remarkBookBlocks() {
  return (tree: MarkdownNode) => {
    const visit = (parent: MarkdownNode) => {
      if (!parent.children) return;
      parent.children = parent.children.flatMap((node) => {
        const replacement = renderBookBlock(node);
        if (replacement) return [replacement];
        visit(node);
        return [node];
      });
    };
    visit(tree);
  };
}
