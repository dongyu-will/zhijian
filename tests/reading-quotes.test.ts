import assert from 'node:assert/strict';
import test from 'node:test';
import { createQuoteDeck, loadRemoteQuotes, parseHitokotoQuote } from '../src/lib/reading-quotes';

test('external quotes retain attribution and reject unsuitable payloads', () => {
  assert.deepEqual(parseHitokotoQuote({ hitokoto: ' 路虽远，行则将至。 ', from_who: '作者', from: '作品' }), { text: '路虽远，行则将至。', source: '作者 · 作品' });
  for (const value of [null, 'quote', {}, { hitokoto: '<script>alert(1)</script>' }, { hitokoto: '短' }, { hitokoto: '长'.repeat(33) }]) assert.equal(parseHitokotoQuote(value), undefined);
});

test('provider rate limits leave the local book usable without retrying', async (context) => {
  const fetch = context.mock.method(globalThis, 'fetch', async () => new Response('', { status: 429 }));
  const received: unknown[] = [];
  await loadRemoteQuotes((quotes) => received.push(...quotes));
  assert.equal(fetch.mock.callCount(), 1);
  assert.equal(received.length, 0);
  const deck = createQuoteDeck();
  assert.notEqual(deck.next().text, deck.next().text);
});

test('new quotes do not change visible pages or duplicate nearby pages', () => {
  const deck = createQuoteDeck();
  const left = deck.next();
  const right = deck.next();
  const remote = { text: '每一步认真探索，都让眼前的世界更清楚。', source: '测试来源' };
  deck.add([remote, remote, right]);
  assert.deepEqual(deck.next(), remote);
  const texts = new Set([left.text, right.text, remote.text]);
  for (let index = 0; index < 14; index += 1) {
    const next = deck.next();
    assert.ok(!texts.has(next.text));
    texts.add(next.text);
  }
  assert.equal(deck.next(), left);
});
