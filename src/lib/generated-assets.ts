import { cpSync, existsSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

// This ignored directory is entirely generated from the current set of resources.
export function resetGeneratedBookAssets(projectRoot: string): void {
  rmSync(resolve(projectRoot, 'public/book-assets'), { recursive: true, force: true });
}

// Book assets are created during prerender, after Astro's initial public copy.
export function publishGeneratedBookAssets(projectRoot: string, outputRoot: string): void {
  const source = resolve(projectRoot, 'public/book-assets');
  const destination = resolve(outputRoot, 'book-assets');
  rmSync(destination, { recursive: true, force: true });
  if (existsSync(source)) cpSync(source, destination, { recursive: true });
}
