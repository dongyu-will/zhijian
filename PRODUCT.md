# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Astro and TypeScript generate a static website. Markdown is the source content; browser storage keeps reading preferences and the last reading location. GitHub Pages is the initial hosting target. Project code uses Apache-2.0; third-party content has separate rights.

## Purpose

**串联各书的知识，建立自己的理解。**

Studyloom aims to connect explanations, examples, and applications of the same knowledge point across different publications, while preserving each publication's complete reading experience. It does not rank books or recommend purchases.

## Current scope

The delivered product is a public Markdown library and reader. It includes catalog search and sorting, document navigation, current-book search, formulas, figures, reading settings, resume reading, and links to source files.

The first release contains mathematics I and II exam papers from 2010–2026: 34 papers and seven referenced figures. Original PDFs and unused source images are not published. These are OCR transcriptions, not fully proofread official editions.

Cross-publication knowledge-point connections are a future direction. Only the homepage positioning and README describe that direction; no topic browser, knowledge graph, automatic linking, or AI interface is currently implemented.

## Readers and contributors

- Readers open complete materials, locate a section, and read comfortably on desktop or mobile.
- Contributors correct canonical Markdown and review changes through GitHub.
- Maintainers publish approved content and keep source links traceable.
- Future AI consumers should be able to use the same canonical content; this does not require a chat interface or change the current reader.

## Content principles

Ordinary Markdown is sufficient. Articles, books, notes, tutorials, and exam collections may use their own structure. Frontmatter, navigation files, short labels, PDF annotations, and count units are optional.

Approved bundled content lives in `content/`. The engine also supports external public GitHub repositories through the catalog; none are enabled in the first release. HTML and search indexes are generated, not separately authored content.

## Visual direction

Keep the homepage white with dark text, restrained green accents, moderate whitespace, and the interactive book illustration. Keep the reader quiet, legible, and responsive. The homepage's wording may express the product direction without advertising future functions as already available.

## Boundaries

Content editing and OCR preparation happen outside the website. There is no account system, upload interface, online editor, database, grading system, or backend API. Future functionality should be introduced only after its scope is agreed and working behavior can be demonstrated.
