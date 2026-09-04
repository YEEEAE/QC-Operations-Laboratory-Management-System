# Google Indexing And SEO Checklist

Use this file when you need the expanded rule set or a full report format after changing HTML.

## 1. Full Audit Triggers

Run a full audit whenever any of the following happens:

1. A new `.html` file is created.
2. An existing `.html` file is modified.
3. A shared HTML template or layout changes.
4. The `head` section changes.
5. Meta tags are added, removed, or edited.
6. Structured data, JSON-LD, or microdata changes.
7. `sitemap.xml` is created or modified.
8. `robots.txt` is created or modified.
9. Canonical URLs or redirects change.
10. Navigation or internal linking changes.
11. Images or media are added without `alt`.
12. New pages or routes are introduced.
13. Server configuration affecting HTML changes.
14. CSS or JS files linked from HTML are moved or renamed.

## 2. Mandatory Google Analytics Injection

This snippet must exist exactly once inside `head`, immediately after charset:

```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-8LLESL207Q"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  gtag('js', new Date());
  gtag('config', 'G-8LLESL207Q');
</script>
```

### Validation Rules

- Create `head` if it is missing.
- Inject the two GA scripts if they are missing.
- Replace the ID if it does not equal `G-8LLESL207Q`.
- Add `async` to `gtag.js` if missing.
- Move the injection into `head` if it appears in `body`.
- Keep one valid copy only if duplicates exist.
- If another `UA-` or `G-` code exists, flag it as a conflict instead of deleting it.

## 3. Document Foundation

- `<!DOCTYPE html>` must be the first line, with no whitespace or BOM before it.
- The `html` tag must include `lang`.
- Arabic pages should use `lang="ar"` or `lang="ar-SA"` and `dir="rtl"`.
- `head` and `body` must both exist and close correctly.
- `body` must contain visible content.

## 4. Preferred `head` Order

Use this as the reference order:

```html
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">

  <script async src="https://www.googletagmanager.com/gtag/js?id=G-8LLESL207Q"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    gtag('js', new Date());
    gtag('config', 'G-8LLESL207Q');
  </script>

  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Page Title — Site Name</title>
  <meta name="description" content="Clear unique page description">
  <link rel="canonical" href="https://www.example.com/page/">
  <meta name="robots" content="index,follow">

  <meta property="og:type" content="website">
  <meta property="og:title" content="Page Title">
  <meta property="og:description" content="Page description">
  <meta property="og:url" content="https://www.example.com/page/">
  <meta property="og:image" content="https://www.example.com/og.jpg">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Page Title">
  <meta name="twitter:description" content="Page description">
  <meta name="twitter:image" content="https://www.example.com/og.jpg">

  <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Page Title",
      "description": "Page description",
      "url": "https://www.example.com/page/"
    }
  </script>
</head>
```

## 5. Core `head` Checks

### Critical

- `charset` exists and is `UTF-8`.
- `viewport` exists and does not use `user-scalable=no` or `maximum-scale=1`.
- `title` exists, is not empty, and is unique across pages.
- Canonical exists, is absolute, and points to the preferred page version.
- Main pages do not carry `noindex`.

### High

- `meta description` exists and is unique.
- Required Open Graph tags are complete: `og:type`, `og:title`, `og:description`, `og:url`, `og:image`.
- Required Twitter tags are complete: `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`.
- JSON-LD is valid and interpretable.

### Medium

- `robots` is explicit even when default indexing would work.
- `preconnect` and `dns-prefetch` exist for important third-party domains.
- JS in `head` uses `async` or `defer` where appropriate.

## 6. Structured Data

For every `application/ld+json` block verify:

- JSON is valid.
- `@context` is `https://schema.org`.
- `@type` exists and matches page intent.
- Dates use ISO 8601.
- URLs are valid.
- Blocks do not conflict.

### Common Schema Suggestions

- Homepage: `Organization` or `WebSite`
- Article pages: `Article` or `BlogPosting`
- Product pages: `Product`
- FAQ pages: `FAQPage`
- Contact pages: `Organization` or `LocalBusiness`
- Visible breadcrumbs: `BreadcrumbList`

Do not invent a schema type when page intent is unclear; recommend it instead.

## 7. Heading Structure

- Exactly one `h1` should exist.
- `h1` should not be empty.
- Keep a logical sequence: `h1 -> h2 -> h3`.
- Do not use headings only for styling.

## 8. Images

For every `<img>`:

- `alt` exists.
- Descriptive `alt` text is not generic like `image` or a filename.
- `width` and `height` exist when practical.
- `loading="lazy"` is used for below-the-fold images only.
- Do not lazy-load the hero image or the LCP image.

For decorative images:

- Use `alt=""`.
- Prefer `aria-hidden="true"` or `role="presentation"`.

## 9. Links

### Internal Links

- `href` points to an existing page.
- Do not use `javascript:` or `href="#"` as real navigation.
- Anchor text should be descriptive.
- Avoid orphaning indexable pages.

### External Links

- Add `rel="noopener noreferrer"` when using `target="_blank"`.
- Use `nofollow` only for untrusted or user-generated links when appropriate.

## 10. URL Structure

- Prefer lowercase.
- Use hyphens, not underscores.
- Avoid spaces and unusual characters.
- Flag file renames instead of applying them automatically if redirects or routing will be affected.

## 11. Mobile-First And Accessibility Basics

- `viewport` exists.
- No fixed-width element should overflow the viewport without responsive handling.
- Base text remains readable.
- Buttons and links remain tappable.
- Use semantic landmarks such as `main`, `nav`, `header`, and `footer`.
- Keep focus states visible.
- Do not hide important mobile content that should still be indexed.

## 12. Supporting Site Files

### `sitemap.xml`

- XML is valid.
- Every indexable page is included.
- URLs match canonical values.
- `lastmod` is sensible when present.

### `robots.txt`

- It lives at the site root.
- It does not block required CSS or JS.
- It does not block important pages.
- It includes a `Sitemap:` line.

## 13. Repair Priority

1. Google Analytics
2. `DOCTYPE` and document foundation
3. `charset` and `viewport`
4. `title`, canonical, and robots
5. Broken internal links
6. `h1` and semantic structure
7. `meta description`
8. Open Graph and Twitter cards
9. Structured data
10. Performance and accessibility signals

## 14. Report Template

Use this structure when a full report is needed:

```text
=== GOOGLE INDEXING AUDIT REPORT ===
Trigger: [what caused the audit]
Files Audited: [count]
Date: [date]

--- GOOGLE ANALYTICS STATUS ---
Files WITH GA code: [count]
Files WITHOUT GA code: [count]
Files with WRONG GA code: [count]
GA ID verified: G-8LLESL207Q

--- CRITICAL ISSUES ---
[issue]
  -> Action: [fix applied or manual action needed]

--- HIGH ISSUES ---
[issue]
  -> Action: [fix applied or manual action needed]

--- MEDIUM ISSUES ---
[issue]
  -> Action: [fix applied or manual action needed]

--- PAGE-BY-PAGE SUMMARY ---
[file.html]
  Title: [present/missing] [length]
  Description: [present/missing] [length]
  Canonical: [present/missing] [url]
  H1: [count] [first heading]
  GA Code: [correct/missing/wrong/duplicate]
  OG Tags: [complete/partial/missing]
  Structured Data: [valid/missing/invalid]
  Images: [total] [without alt]
  Internal Links: [total] [broken]
  Score: [1-10]

--- OVERALL PROJECT SCORE ---
Indexability: [score]/10
SEO Completeness: [score]/10
Technical Health: [score]/10
Mobile Readiness: [score]/10
Overall: [score]/10
=== END REPORT ===
```
