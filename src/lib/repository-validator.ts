import { readFileSync } from 'node:fs';
import { posix, resolve } from 'node:path';
import matter from 'gray-matter';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { chooseEntryMarkdown, discoverSourceFiles, isDiscoverableMarkdownFile } from './github-source';

type MarkdownNode = {
  type?: string;
  url?: string;
  children?: MarkdownNode[];
};

type MarkdownReference = {
  kind: 'image' | 'link';
  url: string;
};

export type ValidatedBookRepository = {
  entryDocument: string;
  markdownFiles: string[];
  sourceFiles: string[];
  warnings: string[];
};

export class RepositoryValidationError extends Error {
  readonly issues: string[];

  constructor(issues: string[]) {
    const uniqueIssues = [...new Set(issues)];
    const shownIssues = uniqueIssues.slice(0, 20);
    const remaining = uniqueIssues.length - shownIssues.length;
    const remainder = remaining > 0 ? `\n- …and ${remaining} more issue${remaining === 1 ? '' : 's'}` : '';
    super(`Repository does not meet the V1 minimum requirements:\n- ${shownIssues.join('\n- ')}${remainder}\nRun the local repository validator after fixing the source.`);
    this.name = 'RepositoryValidationError';
    this.issues = uniqueIssues;
  }
}

function readUtf8(path: string, sourcePath: string, issues: string[]): string | null {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(readFileSync(path));
  } catch {
    issues.push(`${sourcePath}: file must be valid UTF-8`);
    return null;
  }
}

function markdownReferences(markdown: string): MarkdownReference[] {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(markdown) as MarkdownNode;
  const references: MarkdownReference[] = [];

  function visit(node: MarkdownNode): void {
    if ((node.type === 'link' || node.type === 'image') && typeof node.url === 'string') {
      references.push({ kind: node.type, url: node.url });
    }
    node.children?.forEach(visit);
  }

  visit(tree);
  return references;
}

function localReferencePath(sourcePath: string, reference: MarkdownReference, warnings: string[]): string | null {
  const value = reference.url.trim();
  if (!value || value.startsWith('#')) return null;
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(value)) return null;
  if (value.startsWith('/') || value.includes('\\')) {
    warnings.push(`${sourcePath}: ${reference.kind} is not portable because it is not repository-relative (${value})`);
    return null;
  }

  const undecorated = value.split(/[?#]/, 1)[0];
  if (!undecorated) return null;

  let decoded: string;
  try {
    decoded = decodeURIComponent(undecorated);
  } catch {
    warnings.push(`${sourcePath}: ${reference.kind} contains invalid URL encoding (${value})`);
    return null;
  }
  if (decoded.startsWith('/') || decoded.includes('\\')) {
    warnings.push(`${sourcePath}: ${reference.kind} is not portable because it is not repository-relative (${value})`);
    return null;
  }

  const target = posix.normalize(posix.join(posix.dirname(sourcePath), decoded));
  if (target === '..' || target.startsWith('../') || posix.isAbsolute(target)) {
    warnings.push(`${sourcePath}: ${reference.kind} points outside the repository and was left unresolved (${value})`);
    return null;
  }
  return target;
}

function validateMarkdown(
  root: string,
  sourcePath: string,
  files: Set<string>,
  issues: string[],
  warnings: string[]
): void {
  const markdown = readUtf8(resolve(root, sourcePath), sourcePath, issues);
  if (markdown === null) return;

  let content: string;
  try {
    content = matter(markdown).content;
  } catch (error) {
    issues.push(`${sourcePath}: invalid frontmatter (${error instanceof Error ? error.message : String(error)})`);
    return;
  }

  for (const reference of markdownReferences(content)) {
    const target = localReferencePath(sourcePath, reference, warnings);
    if (target && !files.has(target)) {
      warnings.push(`${sourcePath}: ${reference.kind} target does not exist (${reference.url})`);
    }
  }
}

export function validateBookRepository(sourceRoot: string): ValidatedBookRepository {
  const root = resolve(sourceRoot);
  const issues: string[] = [];
  const discovery = discoverSourceFiles(root);
  const files = discovery.files;
  const fileSet = new Set(files);
  const markdownFiles = files.filter(isDiscoverableMarkdownFile);
  const warnings = [...discovery.warnings];

  if (markdownFiles.length === 0) issues.push('Repository must contain at least one Markdown document');
  if (!files.includes('README.md')) warnings.push('README.md: no root entry document; the first Markdown path will be used');

  for (const sourcePath of markdownFiles) validateMarkdown(root, sourcePath, fileSet, issues, warnings);

  if (issues.length > 0) throw new RepositoryValidationError(issues);
  return {
    entryDocument: chooseEntryMarkdown(markdownFiles),
    markdownFiles,
    sourceFiles: files,
    warnings: [...new Set(warnings)]
  };
}
