import { posix } from 'node:path';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { readMarkdown } from './github-source';
import type { ValidatedBookRepository } from './repository-validator';

type MarkdownNode = {
  type?: string;
  url?: string;
  identifier?: string;
  children?: MarkdownNode[];
};

function referencedPath(sourcePath: string, value: string): string | null {
  const url = value.trim();
  if (!url || url.startsWith('#') || url.startsWith('/') || url.includes('\\')) return null;
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(url)) return null;

  const undecorated = url.split(/[?#]/, 1)[0];
  if (!undecorated) return null;

  try {
    const decoded = decodeURIComponent(undecorated);
    if (decoded.startsWith('/') || decoded.includes('\\')) return null;
    const target = posix.normalize(posix.join(posix.dirname(sourcePath), decoded));
    if (target === '..' || target.startsWith('../') || posix.isAbsolute(target)) return null;
    return target;
  } catch {
    return null;
  }
}

function markdownLinks(markdown: string, listOnly: boolean): string[] {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(markdown) as MarkdownNode;
  const definitions = new Map<string, string>();
  const links: string[] = [];

  function collectDefinitions(node: MarkdownNode): void {
    if (node.type === 'definition' && node.identifier && node.url) {
      definitions.set(node.identifier.toLowerCase(), node.url);
    }
    node.children?.forEach(collectDefinitions);
  }

  function collectLinks(node: MarkdownNode, insideList: boolean): void {
    const nextInsideList = insideList || node.type === 'list' || node.type === 'listItem';
    if (!listOnly || nextInsideList) {
      if (node.type === 'link' && node.url) links.push(node.url);
      if (node.type === 'linkReference' && node.identifier) {
        const url = definitions.get(node.identifier.toLowerCase());
        if (url) links.push(url);
      }
    }
    node.children?.forEach((child) => collectLinks(child, nextInsideList));
  }

  collectDefinitions(tree);
  collectLinks(tree, false);
  return links;
}

function rootSummary(sourceFiles: string[]): string | undefined {
  return sourceFiles.find((path) => !path.includes('/') && path.toLowerCase() === 'summary.md');
}

export function orderBookDocuments(sourceRoot: string, repository: ValidatedBookRepository): string[] {
  const documentSet = new Set(repository.markdownFiles);
  const summary = rootSummary(repository.sourceFiles);
  const navigationSource = summary ?? (repository.entryDocument.toLowerCase() === 'readme.md' ? repository.entryDocument : undefined);
  const listedDocuments: string[] = [];

  if (navigationSource) {
    const markdown = readMarkdown(sourceRoot, navigationSource);
    const links = markdownLinks(markdown, navigationSource.toLowerCase() !== 'summary.md');
    for (const link of links) {
      const target = referencedPath(navigationSource, link);
      if (target && documentSet.has(target) && !listedDocuments.includes(target)) listedDocuments.push(target);
    }
  }

  const ordered = [repository.entryDocument, ...listedDocuments.filter((path) => path !== repository.entryDocument)];
  for (const sourcePath of repository.markdownFiles) {
    if (!ordered.includes(sourcePath)) ordered.push(sourcePath);
  }
  return ordered;
}
