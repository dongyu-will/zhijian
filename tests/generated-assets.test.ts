import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { publishGeneratedBookAssets, resetGeneratedBookAssets } from '../src/lib/generated-assets';

test('a new build removes withdrawn book assets and preserves other public files', () => {
  const root = mkdtempSync(join(tmpdir(), 'studyloom-assets-'));
  try {
    const oldBook = join(root, 'public/book-assets/withdrawn');
    mkdirSync(oldBook, { recursive: true });
    writeFileSync(join(oldBook, 'private.pdf'), 'old generated data');
    writeFileSync(join(root, 'public/logo.svg'), '<svg/>');
    resetGeneratedBookAssets(root);
    assert.equal(existsSync(join(root, 'public/book-assets')), false);
    assert.equal(existsSync(join(root, 'public/logo.svg')), true);
    resetGeneratedBookAssets(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('publishing copies newly rendered assets without retaining withdrawn output', () => {
  const root = mkdtempSync(join(tmpdir(), 'studyloom-publish-'));
  const output = join(root, 'dist');
  try {
    mkdirSync(join(root, 'public/book-assets/current'), { recursive: true });
    writeFileSync(join(root, 'public/book-assets/current/figure.jpg'), 'approved figure');
    mkdirSync(join(output, 'book-assets/withdrawn'), { recursive: true });
    writeFileSync(join(output, 'book-assets/withdrawn/source.pdf'), 'withdrawn');
    writeFileSync(join(output, 'index.html'), 'reader');
    publishGeneratedBookAssets(root, output);
    assert.equal(existsSync(join(output, 'book-assets/current/figure.jpg')), true);
    assert.equal(existsSync(join(output, 'book-assets/withdrawn')), false);
    assert.equal(existsSync(join(output, 'index.html')), true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
