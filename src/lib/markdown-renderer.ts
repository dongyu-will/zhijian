import { posix } from 'node:path';
import { unified } from 'unified';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import { defaultSchema } from 'hast-util-sanitize';
import { remarkBookBlocks } from './book-blocks';
import type { SearchSection } from './book-search';

export type MarkdownHeading = { id: string; title: string; level: number; sourcePdfPage?: number };

export type RenderedMarkdown = {
  html: string;
  headings: MarkdownHeading[];
  searchSections: SearchSection[];
};

export type RepositoryMarkdownOptions = {
  sourcePath: string;
  entryDocument: string;
  documentPaths: string[];
  bookBase: string;
  assetBase: string;
  sourcePdfFilename?: string;
};

type HastNode = {
  type?: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

const markdownSanitizeSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), 'figure', 'figcaption'],
  attributes: {
    ...defaultSchema.attributes,
    '*': [...(defaultSchema.attributes?.['*'] ?? []), 'className'],
    ...Object.fromEntries(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map((tag) => [tag, [...(defaultSchema.attributes?.[tag] ?? []), 'dataSourcePage']]))
  }
};

function splitUrlSuffix(value: string): { path: string; suffix: string } {
  const queryIndex = value.indexOf('?');
  const hashIndex = value.indexOf('#');
  const indexes = [queryIndex, hashIndex].filter((index) => index >= 0);
  const suffixIndex = indexes.length > 0 ? Math.min(...indexes) : value.length;
  return { path: value.slice(0, suffixIndex), suffix: value.slice(suffixIndex) };
}

function encodeSourcePath(path: string): string {
  return path.split('/').filter(Boolean).map(encodeURIComponent).join('/');
}

function repositoryTarget(value: string, sourcePath: string): { path: string; suffix: string } | null {
  if (!value || value.startsWith('#') || /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(value)) return null;
  const { path, suffix } = splitUrlSuffix(value);
  if (!path) return null;

  try {
    const decoded = decodeURIComponent(path).replace(/\\/g, '/');
    const fromRoot = decoded.startsWith('/');
    const target = posix.normalize(posix.join(fromRoot ? '' : posix.dirname(sourcePath), decoded.replace(/^\/+/, '')));
    if (target === '..' || target.startsWith('../') || posix.isAbsolute(target)) return null;
    return { path: target, suffix };
  } catch {
    return null;
  }
}

function documentTarget(path: string, documentPaths: Set<string>): string | null {
  const candidates = [
    path,
    `${path}.md`,
    `${path}.markdown`,
    posix.join(path, 'README.md'),
    posix.join(path, 'README.markdown')
  ];
  return candidates.find((candidate) => documentPaths.has(candidate))
    ?? (/\.(?:md|markdown)$/i.test(path) ? path : null);
}

function rewriteRepositoryUrl(
  value: string,
  kind: 'image' | 'link',
  options: RepositoryMarkdownOptions,
  documentPaths: Set<string>
): string {
  const target = repositoryTarget(value, options.sourcePath);
  if (!target) return value;

  if (kind === 'link') {
    const path = documentTarget(target.path, documentPaths);
    if (path) {
      if (path === options.entryDocument) return `${options.bookBase}/${target.suffix}`;
      const routePath = path.replace(/\.(?:md|markdown)$/i, '');
      return `${options.bookBase}/${encodeSourcePath(routePath)}/${target.suffix}`;
    }
  }

  const assetPath = target.path === '.' ? '' : encodeSourcePath(target.path);
  return `${options.assetBase}/${assetPath}${target.suffix}`;
}

function rehypeRepositoryUrls(options: RepositoryMarkdownOptions) {
  const documentPaths = new Set(options.documentPaths);
  return (tree: HastNode) => {
    const visit = (node: HastNode) => {
      const property = node.tagName === 'a' ? 'href' : node.tagName === 'img' ? 'src' : null;
      if (property && typeof node.properties?.[property] === 'string') {
        node.properties[property] = rewriteRepositoryUrl(
          node.properties[property] as string,
          node.tagName === 'img' ? 'image' : 'link',
          options,
          documentPaths
        );
      }
      node.children?.forEach(visit);
    };
    visit(tree);
  };
}

export function slugifyHeading(value: string): string {
  return value.trim().toLowerCase().replace(/[^\p{Letter}\p{Number}]+/gu, '-').replace(/^-+|-+$/g, '') || 'section';
}

function textFromHast(node: HastNode): string {
  if (node.type === 'text') return node.value ?? '';
  if (node.tagName === 'img' && typeof node.properties?.alt === 'string') return node.properties.alt;
  return (node.children ?? []).map(textFromHast).join('');
}

function rehypeHeadingIds(options: { headings: MarkdownHeading[] }) {
  return (tree: HastNode) => {
    const slugCounts = new Map<string, number>();
    const visit = (node: HastNode) => {
      if (node.tagName && /^h[1-6]$/.test(node.tagName)) {
        const title = textFromHast(node).trim();
        const base = slugifyHeading(title);
        const count = slugCounts.get(base) ?? 0;
        const id = count ? `${base}-${count + 1}` : base;
        slugCounts.set(base, count + 1);
        node.properties = { ...(node.properties ?? {}), id };
        const page = node.properties.dataSourcePage;
        options.headings.push({ id, title, level: Number(node.tagName.slice(1)), ...(typeof page === 'number' ? { sourcePdfPage: page } : {}) });
      }
      node.children?.forEach(visit);
    };
    visit(tree);
  };
}

function rehypeSourcePages(options: { filename?: string }) {
  return (tree: HastNode) => {
    let page: number | undefined;
    let pending: HastNode[] = [];
    const setPage = (node: HastNode, value: number) => {
      node.properties = { ...node.properties, dataSourcePage: value };
    };
    const visit = (node: HastNode) => {
      if (node.type === 'comment') {
        const source = /^\s*source:\s*(.+?);\s*PDF\s*第\s*([1-9]\d*)\s*页\s*$/.exec(node.value ?? '');
        if (source && source[1] === options.filename && Number.isSafeInteger(Number(source[2]))) {
          page = Number(source[2]);
          pending.forEach((heading) => setPage(heading, page!));
          pending = [];
        }
      }
      if (node.tagName && /^h[1-6]$/.test(node.tagName)) {
        // Only actual source comments may supply page numbers, never raw HTML attributes.
        if (node.properties) delete node.properties.dataSourcePage;
        if (/^h[12]$/.test(node.tagName)) {
          page = undefined;
          pending.push(node);
        } else if (page !== undefined) setPage(node, page);
      }
      node.children?.forEach(visit);
    };
    visit(tree);
  };
}

function rehypeLazyImages() {
  return (tree: HastNode) => {
    const visit = (node: HastNode) => {
      if (node.tagName === 'img') {
        node.properties = { ...node.properties, loading: 'lazy' };
      }
      node.children?.forEach(visit);
    };
    visit(tree);
  };
}

function rehypeSearchSections(options: { sections: SearchSection[] }) {
  return (tree: HastNode) => {
    let current: SearchSection = { id: '', title: '', text: '' };
    options.sections.push(current);
    const visit = (node: HastNode) => {
      if (node.type === 'comment') return;
      const classes = node.properties?.className;
      if (Array.isArray(classes) && classes.some((name) => name === 'math-inline' || name === 'math-display' || name === 'language-math')) {
        current.text += '（公式）'; return;
      }
      if (node.tagName && /^h[1-6]$/.test(node.tagName)) {
        current = { id: String(node.properties?.id ?? ''), title: textFromHast(node).trim(), text: '' };
        options.sections.push(current);
        return;
      }
      if (node.type === 'text') current.text += node.value ?? '';
      if (node.tagName === 'img') current.text += textFromHast(node);
      node.children?.forEach(visit);
      if (node.tagName && /^(p|li|div|pre|tr|br)$/.test(node.tagName)) current.text += ' ';
    };
    visit(tree);
    options.sections.forEach((section) => { section.text = section.text.replace(/\s+/g, ' ').trim(); });
  };
}

async function processMarkdown(markdown: string, options?: RepositoryMarkdownOptions): Promise<RenderedMarkdown> {
  const headings: MarkdownHeading[] = [];
  const searchSections: SearchSection[] = [];
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkBookBlocks)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSourcePages, { filename: options?.sourcePdfFilename })
    .use(rehypeSanitize, markdownSanitizeSchema);
  if (options) processor.use(rehypeRepositoryUrls, options);
  const file = await processor
    .use(rehypeLazyImages)
    .use(rehypeHeadingIds, { headings })
    .use(rehypeSearchSections, { sections: searchSections })
    .use(rehypeKatex)
    .use(rehypeStringify)
    .process(markdown);
  return { html: String(file), headings, searchSections: searchSections.filter((section) => section.title || section.text) };
}

export async function renderMarkdown(markdown: string): Promise<string> {
  return (await processMarkdown(markdown)).html;
}

export async function renderRepositoryMarkdown(markdown: string, options: RepositoryMarkdownOptions): Promise<string> {
  return (await processMarkdown(markdown, options)).html;
}

export function renderRepositoryDocument(markdown: string, options: RepositoryMarkdownOptions): Promise<RenderedMarkdown> {
  return processMarkdown(markdown, options);
}

export function markdownText(markdown: string): string {
  return markdown
    .replace(/^---[\s\S]*?---\s*/m, '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*_`~\[\]()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function stripLeadingDocumentHeading(html: string, title: string): { html: string; stripped: boolean } {
  const expectedId = slugifyHeading(title);
  const escapedId = expectedId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = new RegExp(`^\\s*<h1\\b[^>]*\\bid=["']${escapedId}["'][^>]*>[\\s\\S]*?<\\/h1>\\s*`, 'i').exec(html);
  if (!match) return { html, stripped: false };
  return { html: html.slice(match[0].length), stripped: true };
}
