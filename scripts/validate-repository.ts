import { resolve } from 'node:path';
import { validateBookRepository } from '../src/lib/repository-validator';

const sourceRoot = process.argv[2];
if (!sourceRoot) {
  console.error('Usage: npm run validate:repository -- <repository-directory>');
  process.exitCode = 1;
} else {
  try {
    const validated = validateBookRepository(resolve(sourceRoot));
    validated.warnings.forEach((warning) => console.warn(`Warning: ${warning}`));
    console.log(`Repository accepted by V1: ${validated.markdownFiles.length} Markdown documents, ${validated.warnings.length} warnings`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
