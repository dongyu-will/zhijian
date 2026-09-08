---
name: 知间
description: Public Markdown library and focused reader.
---

# Design

## Identity

The homepage leads with “串联各书的知识，建立自己的理解。” Supporting copy describes connecting knowledge as a direction; current controls remain “浏览资料” and “继续阅读”. Keep the identity broad enough for books, articles, notes, and tutorials beyond the initial mathematics collection.

## Color and typography

Use the existing CSS tokens as the source of truth. The homepage has a white canvas, dark text (`#30332f`), muted text (`#62665f`), and a restrained green accent (`#4d6255`). The reader uses white and light gray surfaces with dark text, plus its existing optional dark theme.

Use the existing sans-serif stack. Homepage display type scales up to 60px, with a smaller mobile setting. Reader body text defaults to 16px with 1.7 line-height and an 840px maximum width. Reading settings allow 14px or 18px text.

## Homepage

Keep moderate whitespace, flat surfaces, and simple dividers. The desktop introduction pairs the main text with an interactive open book. Its container is 500px wide, 380px below 1000px, and 230px on mobile. Quote text scales with the book. Preserve the manual page-turn interaction and source credit.

Catalog entries size to their content. Show repository stars for external resources and “本地资源” for bundled resources. Count units come from resource metadata, falling back to “篇内容”. Do not introduce fixed exam-specific layouts into the general catalog.

## Reader

The text column shares space with optional navigation rails. At narrow widths, rails open as drawers with a backdrop, keyboard focus containment, Escape dismissal, and focus return. Hidden drawers must not remain interactive.

Entry documents display their original content directly. Chapter selection belongs in the existing directory; do not add duplicate chapter grids or start-reading controls. Directory labels use the author's title or optional short label, without adding sequence numbers.

Tables and code scroll within their own containers. Figures retain their aspect ratio and fit the available width. Source actions stay accessible below a scrollable section index. PDF links appear only when an available PDF has actually been included.

Search results link to source sections and show matching context. Compact labels may identify a resource and document, while full source titles remain available. Loading, failure, and empty states must be understandable.

## Interaction and verification

Use clear focus states, accessible labels, adequate contrast, and comfortable touch targets. Respect reduced motion. Check desktop, narrow desktop, and mobile layouts when changing the interface. Preserve content, formula line boxes, readable figure sizes, and page-level overflow behavior.

Cross-book knowledge-point navigation is not part of the current interface. Add it only when implementing an agreed feature, not as decorative controls or placeholder promises.
