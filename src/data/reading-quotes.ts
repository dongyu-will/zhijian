export interface ReadingQuote {
  text: string;
  source: string;
  sourceUrl?: string;
}

/** Original copy, rather than quotations attributed to historical authors. */
export const fallbackReadingQuotes: ReadingQuote[] = [
  '不必等到准备完美，先向前迈出一小步。',
  '今天多懂一点，明天就多一种可能。',
  '让好奇带路，让行动给出答案。',
  '读不懂的地方，正是新的起点。',
  '慢一点也没关系，重要的是还在前进。',
  '把大问题拆小，把小进步积累起来。',
  '每一次认真尝试，都在拓宽你的边界。',
  '允许自己从不会开始，再一步步学会。',
  '今天种下的问题，会长成明天的理解。',
  '知识不必一次读完，成长可以日积月累。',
  '找到适合自己的节奏，让坚持变得轻松。',
  '留一点时间给探索，也留一点耐心给自己。',
  '分享一个发现，也许就能点亮另一段旅程。',
  '把收获写下来，让下一次出发更有方向。',
  '新的视角，往往从一个简单的问题开始。',
  '走过的弯路，也能成为理解世界的线索。'
].map((text) => ({ text, source: '知间寄语 · 原创' }));
