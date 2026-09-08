import { tsImport } from 'tsx/esm/api';

const { loadCatalog } = await tsImport('../src/lib/catalog-loader.ts', import.meta.url);
const entries = loadCatalog();
console.log(`Catalog valid: ${entries.length} entries`);
