---
name: google-indexing-seo-guardian
description: "Audit and repair Google crawling, indexing, and SEO readiness for static HTML sites after page or markup changes. Use when Codex creates, edits, or restructures any `.html` file, changes the head section, meta tags, canonical links, JSON-LD, `sitemap.xml`, `robots.txt`, internal navigation, image alt text, or CSS/JS asset paths linked from HTML. Trigger on requests about indexing, crawlability, head tags, metadata, sitemap, robots, Google visibility, فهرسة Google, الأرشفة, السيو التقني لصفحات HTML, أو إصلاح وسوم الصفحة. Ensure Google Analytics ID `G-8LLESL207Q` exists in head on every page, fix safe issues immediately, and produce a full indexing audit report."
---

# Google Indexing SEO Guardian

## Overview

Use this skill as a post-change quality gate for anything that can affect Google discovery, crawling, indexing, or ranking signals in HTML-based pages. The goal is not only to inspect individual tags, but to ensure every affected page remains crawlable, indexable, semantically coherent, and correctly instrumented with Google Analytics.

## Workflow

1. Define the audit scope first.
   Review every directly affected `.html` file. If the change touches shared `head` logic, layout, navigation, canonical handling, `sitemap.xml`, `robots.txt`, or asset paths linked from HTML, expand the audit to all HTML pages because duplicate titles, broken links, and canonical drift are cross-page problems.
2. Start with the helper audit.
   Run `python3 scripts/google_indexing_audit.py <workspace-or-paths>` for a fast baseline. Do not rely on it alone; manually inspect any page involving `title`, `description`, canonical logic, JSON-LD, or heading structure.
3. Fix safe and unambiguous issues immediately.
   Fix Google Analytics injection, placement inside `head`, duplication, `DOCTYPE`, `lang`, `dir`, `charset`, `viewport`, clearly broken internal links, and JSON-LD syntax errors that do not change meaning.
4. Do not invent semantic content.
   Do not fabricate `title`, `meta description`, canonical URLs, descriptive `alt` text, or schema types from scratch. If the issue needs editorial judgment, product context, or URL strategy, flag it clearly instead of guessing.
5. Re-validate before closing.
   Re-run the audit after edits, inspect the affected snippets, and verify the changes did not create new canonical drift, break structured data, or move `head` scripts into an invalid order.

## Google Analytics Is Mandatory

Every HTML file must contain this injection exactly once inside `head`, immediately after `<meta charset="UTF-8">`, as the first two scripts in `head`:

```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-8LLESL207Q"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  gtag('js', new Date());
  gtag('config', 'G-8LLESL207Q');
</script>
```

Always verify:

- The ID is exactly `G-8LLESL207Q`.
- The external script uses `async`.
- Both scripts are inside `head`, not `body`.
- There is only one valid injection pair.
- If another `UA-` or `G-` code exists, flag the conflict instead of removing it automatically.

## Safe Fixes vs. Manual Review

Apply the fix immediately when it is safe and unambiguous:

- Add or correct `<!DOCTYPE html>` on the first line.
- Add the correct `lang` value and `dir="rtl"` for clearly RTL pages.
- Add `<meta charset="UTF-8">` and the correct `viewport`.
- Move or deduplicate the Google Analytics injection.
- Add missing OG and Twitter tags when they can be mirrored directly from existing `title`, `description`, `canonical`, and `og:image` values.
- Repair a broken internal link when there is only one obvious target.
- Fix invalid JSON-LD syntax if the underlying schema meaning stays the same.

Escalate for review and do not guess:

- Missing, weak, or duplicate `title` values.
- Missing, duplicate, or low-quality `meta description` values.
- Missing canonicals when the preferred domain or URL pattern is uncertain.
- Descriptive `alt` text for non-decorative images.
- The correct schema type when page intent is unclear.
- File renames or URL slug changes with downstream routing or redirect impact.

## Repair Order

Apply fixes in this order:

1. Missing, wrong, or duplicated Google Analytics.
2. Document foundation: `DOCTYPE`, `html`, `head`, `body`, `charset`, `viewport`.
3. Canonical, robots, and accidental `noindex`.
4. `title`, `description`, `h1`, and internal links.
5. Open Graph, Twitter cards, and structured data.
6. Images, semantics, performance hints, and basic accessibility signals.

## Hard Rules

- Never add `noindex` unless the user explicitly asks for it.
- Never remove valid structured data or custom meta tags unless they are clearly wrong.
- Never rewrite `title` or `meta description` with invented content.
- Always use absolute URLs in canonical tags.
- Assume primary pages should remain indexable by default.
- Prefer fixing over flagging when the fix is safe and obvious.

## References And Tools

- Read [references/google-indexing-checklist.md](references/google-indexing-checklist.md) for the full checklist, the preferred `head` order, and the audit report template.
- Use `scripts/google_indexing_audit.py` to collect fast findings for GA, `title`, `description`, canonical, `viewport`, `h1`, image `alt`, internal links, and duplicate titles or descriptions.

## Close-Out Requirements

At the end of the task:

1. State what you fixed.
2. Separate critical issues from issues that still need human judgment.
3. Provide page-by-page summaries when the audit is broad.
4. State whether Google Analytics is correct on every reviewed page.
