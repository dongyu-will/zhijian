import { cpSync, existsSync, lstatSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, resolve, sep } from 'node:path';
import matter from 'gray-matter';
import type { CatalogEntry } from './catalog-loader';
import { orderBookDocuments } from './document-order';
import { clonePublicGitHubRepository, fetchRepositoryStars, ignoredSourceDirectories, readMarkdown, sourceFileUrl, titleFromSourcePath, type SourceSnapshot } from './github-source';
import { renderRepositoryDocument, stripLeadingDocumentHeading, type MarkdownHeading } from './markdown-renderer';
import { validateBookRepository, type ValidatedBookRepository } from './repository-validator';
import { resolveBookSourceRoot } from './source-root';
import type { SearchSection } from './book-search';

export type BuiltDocument = {
  sourcePath: string;
  sourceMarkdown: string;
  sourcePdfPages: number[];
  title: string;
  navigationTitle?: string;
  html: string;
  headings: MarkdownHeading[];
  sourceUrl: string | null;
  searchText: string;
  searchSections: SearchSection[];
};

export type BookMetadata = Pick<CatalogEntry, 'slug' | 'title' | 'author' | 'description' | 'status'> & {
  shortTitle?: string;
  contentUnit?: string;
  repository?: string;
  rootDirectory?: string;
  sourcePdfPath?: string;
  stars?: number | null;
};

export type BuiltBook = {
  catalog: BookMetadata;
  origin: 'catalog' | 'local';
  defaultBranch: string;
  commitSha: string;
  stars: number | null;
  entryDocument: BuiltDocument;
  documents: BuiltDocument[];
  sourcePdfUrl: string | null;
};

function siteBasePath(): string {
  return (process.env.PUBLIC_BASE_PATH || (process.env.NODE_ENV === 'production' ? '/zhijian' : '/')).replace(/\/$/, '');
}

function publicAssetUrl(slug: string, sourcePath: string): string {
  return `${siteBasePath()}/book-assets/${slug}/${sourcePath.split(/[\\/]+/).map(encodeURIComponent).join('/')}`;
}

function documentTitle(sourcePath: string, metadata: Record<string, unknown>, headings: MarkdownHeading[]): string {
  const frontmatterTitle = typeof metadata.title === 'string' ? metadata.title.trim() : '';
  if (frontmatterTitle) return frontmatterTitle;
  const heading = headings.find((item) => item.level === 1) ?? headings[0];
  return heading?.title ?? titleFromSourcePath(sourcePath);
}

function sourcePdfPages(markdown: string): number[] {
  const parsed = matter(markdown);
  const frontmatterPages = parsed.data.source_pages;
  const pages = typeof frontmatterPages === 'string'
    ? frontmatterPages.split(',').map((value) => Number.parseInt(value.trim(), 10))
    : Array.isArray(frontmatterPages)
      ? frontmatterPages.map((value) => Number(value))
      : [];
  const headingPages = [...parsed.content.matchAll(/PDF\s*第\s*(\d+)\s*页/gi)].map((match) => Number(match[1]));
  return [...new Set([...pages, ...headingPages].filter((page) => Number.isInteger(page) && page > 0))];
}

async function buildDocuments(
  sourceRoot: string,
  catalog: BookMetadata,
  sourceUrlFor: (sourcePath: string) => string | null,
  validated: ValidatedBookRepository
): Promise<{ documents: BuiltDocument[]; entryDocument: BuiltDocument }> {
  const files = orderBookDocuments(sourceRoot, validated);
  const entryPath = validated.entryDocument;
  const documents: BuiltDocument[] = [];
  for (const sourcePath of files) {
    try {
      const raw = readMarkdown(sourceRoot, sourcePath);
      const parsed = matter(raw);
      const siteBase = siteBasePath();
      const rendered = await renderRepositoryDocument(parsed.content, {
        sourcePath,
        entryDocument: entryPath,
        documentPaths: files,
        bookBase: `${siteBase}/books/${catalog.slug}`,
        assetBase: `${siteBase}/book-assets/${catalog.slug}`,
        sourcePdfFilename: catalog.sourcePdfPath?.split('/').pop()
      });
      const title = documentTitle(sourcePath, parsed.data, rendered.headings);
      const withoutDuplicateTitle = stripLeadingDocumentHeading(rendered.html, title);
      const html = withoutDuplicateTitle.html;
      const headings = withoutDuplicateTitle.stripped ? rendered.headings.slice(1) : rendered.headings;
      documents.push({
        sourcePath,
        sourceMarkdown: raw,
        sourcePdfPages: sourcePdfPages(raw),
        title,
      navigationTitle: typeof parsed.data.navigationTitle === 'string' ? parsed.data.navigationTitle.trim() || undefined : undefined,
        html,
        headings,
        sourceUrl: sourceUrlFor(sourcePath),
      searchText: rendered.searchSections.map((section) => `${section.title} ${section.text}`).join(' '),
      searchSections: rendered.searchSections.map((section) => ({ ...section, id: withoutDuplicateTitle.stripped && section.id === rendered.headings[0]?.id ? '' : section.id }))
      });
    } catch (error) {
      throw new Error(`[${catalog.title}] parse/render failed for ${sourcePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  const entryDocument = documents.find((document) => document.sourcePath === entryPath);
  if (!entryDocument) throw new Error(`[${catalog.title}] entry document disappeared: ${entryPath}`);
  return { documents, entryDocument };
}

function validateSourceRepository(sourceRoot: string, catalog: BookMetadata): ValidatedBookRepository {
  try {
    const validated = validateBookRepository(sourceRoot);
    const shownWarnings = validated.warnings.slice(0, 10);
    shownWarnings.forEach((warning) => console.warn(`[${catalog.title}] repository warning: ${warning}`));
    if (validated.warnings.length > shownWarnings.length) {
      console.warn(`[${catalog.title}] repository warning: …and ${validated.warnings.length - shownWarnings.length} more`);
    }
    return validated;
  } catch (error) {
    const source = catalog.repository ? ` (${catalog.repository}, rootDirectory=${catalog.rootDirectory ?? '.'})` : '';
    throw new Error(`[${catalog.title}] validation failed${source}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function copyBookAssets(sourceRoot: string, slug: string): void {
  const publicAssetRoot = resolve(process.cwd(), 'public/book-assets', slug);
  rmSync(publicAssetRoot, { recursive: true, force: true });
  cpSync(sourceRoot, publicAssetRoot, {
    recursive: true,
    dereference: false,
    filter: (source) => {
      const path = relative(sourceRoot, source).split(sep).join('/');
      const ignored = path.split('/').some((segment) => segment.startsWith('.') || ignoredSourceDirectories.has(segment));
      return !ignored && !lstatSync(source).isSymbolicLink();
    }
  });
}

export type RepositoryBuildDependencies = {
  cloneRepository: typeof clonePublicGitHubRepository;
  fetchStars: typeof fetchRepositoryStars;
};

const repositoryBuildDependencies: RepositoryBuildDependencies = {
  cloneRepository: clonePublicGitHubRepository,
  fetchStars: fetchRepositoryStars
};

type RepositoryBuildSource = { snapshot: SourceSnapshot; stars: number | null };

function createRepositoryBuildSession(dependencies: RepositoryBuildDependencies) {
  const workRoot = mkdtempSync(join(tmpdir(), 'wiki-books-'));
  const sources = new Map<string, Promise<RepositoryBuildSource>>();

  return {
    source(repository: string): Promise<RepositoryBuildSource> {
      const key = repository.replace(/\/$/, '').replace(/\.git$/i, '').toLowerCase();
      let source = sources.get(key);
      if (!source) {
        const destination = join(workRoot, `repository-${sources.size}`);
        source = (async () => {
          const snapshot = dependencies.cloneRepository(repository, destination);
          const stars = await dependencies.fetchStars(repository);
          return { snapshot, stars };
        })();
        sources.set(key, source);
      }
      return source;
    },
    dispose(): void {
      rmSync(workRoot, { recursive: true, force: true });
    }
  };
}

async function buildCatalogBook(
  catalog: CatalogEntry,
  session: ReturnType<typeof createRepositoryBuildSession>
): Promise<BuiltBook> {
  const context = `[${catalog.title}] (${catalog.repository}, rootDirectory=${catalog.rootDirectory})`;
  let source: RepositoryBuildSource;
  try {
    source = await session.source(catalog.repository);
  } catch (error) {
    throw new Error(`${context} clone failed: ${error instanceof Error ? error.message : String(error)}`);
  }
  const { snapshot, stars } = source;
  let sourceRoot: string;
  try {
    sourceRoot = resolveBookSourceRoot(snapshot.localPath, catalog.rootDirectory);
  } catch (error) {
    throw new Error(`${context} source-root selection failed: ${error instanceof Error ? error.message : String(error)}`);
  }
  const validated = validateSourceRepository(sourceRoot, catalog);
  const { documents, entryDocument } = await buildDocuments(
    sourceRoot,
    catalog,
    (sourcePath) => sourceFileUrl(snapshot, catalog.rootDirectory === '.' ? sourcePath : `${catalog.rootDirectory}/${sourcePath}`),
    validated
  );
  copyBookAssets(sourceRoot, catalog.slug);
  return { catalog, origin: 'catalog', defaultBranch: snapshot.defaultBranch, commitSha: snapshot.commitSha, stars, entryDocument, documents, sourcePdfUrl: null };
}

export async function buildBook(catalog: CatalogEntry): Promise<BuiltBook> {
  const session = createRepositoryBuildSession(repositoryBuildDependencies);
  try {
    return await buildCatalogBook(catalog, session);
  } finally {
    session.dispose();
  }
}

export async function buildLocalBook(catalog: BookMetadata, sourceRoot: string, sourceUrlFor: (sourcePath: string) => string | null = () => null): Promise<BuiltBook> {
  const validated = validateSourceRepository(sourceRoot, catalog);
  const { documents, entryDocument } = await buildDocuments(sourceRoot, catalog, sourceUrlFor, validated);
  copyBookAssets(sourceRoot, catalog.slug);
  const sourcePdfUrl = catalog.sourcePdfPath && existsSync(resolve(sourceRoot, catalog.sourcePdfPath))
    ? publicAssetUrl(catalog.slug, catalog.sourcePdfPath)
    : null;
  return {
    catalog,
    origin: 'local',
    defaultBranch: '',
    commitSha: '',
    stars: catalog.stars ?? null,
    entryDocument,
    documents,
    sourcePdfUrl
  };
}

export async function buildCatalog(
  catalog: CatalogEntry[],
  dependencies: RepositoryBuildDependencies = repositoryBuildDependencies
): Promise<BuiltBook[]> {
  const session = createRepositoryBuildSession(dependencies);
  try {
    const books: BuiltBook[] = [];
    for (const entry of catalog.filter((item) => item.status === 'active')) {
      try {
        books.push(await buildCatalogBook(entry, session));
      } catch (error) {
        if (process.env.NODE_ENV === 'production') throw error;
        console.warn(`[${entry.title}] skipped during development: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    return books;
  } finally {
    session.dispose();
  }
}
