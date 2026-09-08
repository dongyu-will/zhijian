import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'yaml';
import { z } from 'zod';
import { isValidRootDirectory } from './source-root';

const catalogEntrySchema = z.object({
  title: z.string().trim().min(1),
  author: z.string().trim().min(1),
  repository: z.string().refine((value) => {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && url.hostname === 'github.com' && !url.username && !url.password && !url.port && !url.search && !url.hash && /^\/[\w.-]+\/[\w.-]+\/?$/.test(url.pathname);
    } catch {
      return false;
    }
  }, 'repository must be a public GitHub URL'),
  rootDirectory: z.string().refine(isValidRootDirectory, 'rootDirectory must be . or a visible repository-relative directory without traversal or URL encoding').default('.'),
  description: z.string().optional(),
  status: z.enum(['active', 'blocked']).default('active')
});

export type CatalogEntry = z.infer<typeof catalogEntrySchema> & { slug: string };

const booksDirectory = resolve(process.cwd(), 'catalog/books');

export function loadCatalog(directory = booksDirectory): CatalogEntry[] {
  return readdirSync(directory)
    .filter((filename: string) => filename.endsWith('.yaml'))
    .sort()
    .map((filename: string) => {
      const slug = filename.replace(/\.yaml$/, '');
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error(`Invalid Catalog slug: ${slug}`);
      const parsed = catalogEntrySchema.safeParse(parse(readFileSync(resolve(directory, filename), 'utf8')));
      if (!parsed.success) {
        throw new Error(`Invalid Catalog entry ${filename}: ${parsed.error.message}`);
      }
      return { slug, ...parsed.data };
    });
}
