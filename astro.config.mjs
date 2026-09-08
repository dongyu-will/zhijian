import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';
import { publishGeneratedBookAssets, resetGeneratedBookAssets } from './src/lib/generated-assets.ts';

let projectRoot;

export default defineConfig({
  output: 'static',
  site: process.env.PUBLIC_SITE_URL || 'https://dongyu-will.github.io',
  base: process.env.PUBLIC_BASE_PATH || (process.env.NODE_ENV === 'production' ? '/studyloom' : '/'),
  integrations: [{
    name: 'current-book-assets',
    hooks: {
      'astro:config:setup': ({ command, config }) => {
        projectRoot = fileURLToPath(config.root);
        if (command === 'build' || command === 'dev') resetGeneratedBookAssets(projectRoot);
      },
      'astro:build:done': ({ dir }) => {
        publishGeneratedBookAssets(projectRoot, fileURLToPath(dir));
      }
    }
  }],
  devToolbar: {
    enabled: false
  },
  build: {
    format: 'directory'
  }
});
