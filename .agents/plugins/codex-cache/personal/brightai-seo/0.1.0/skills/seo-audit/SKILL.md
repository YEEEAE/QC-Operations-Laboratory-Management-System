---
name: seo-audit
description: Perform a comprehensive technical, on-page, structured-data, indexability, internal-linking, performance, accessibility, and security-aware SEO audit for BRIGHTAI.
---

# Comprehensive SEO Audit

Use this skill for a full SEO audit or when the user asks why a BRIGHTAI page is not ranking or being indexed.

## Audit contract

Inspect the repository and, when requested and available, the live canonical site. Cover:

- crawlability, status codes, robots, sitemap, canonicals, hreflang, redirects, and orphan pages;
- HTML-first content, headings, titles, descriptions, Open Graph, Arabic RTL, and internal links;
- JSON-LD by page type, entity clarity, breadcrumbs, FAQ, Article, Service, WebSite, and Organization;
- Core Web Vitals budgets, image dimensions/formats, JavaScript/CSS weight, and font loading;
- WCAG AA basics that affect SEO: semantics, language, alt text, focus, contrast, and mobile layout;
- security and CSP constraints when inspecting rendered HTML.

## Output

Report findings as `ID | severity | evidence | impact | recommended fix | verification`. Link each finding to an exact file/line or URL. Distinguish confirmed defects from hypotheses. For public pages, treat `index, follow`, self-canonical, sitemap inclusion, HTTP 200, and HTML-visible content as the default acceptance criteria.

Run the narrowest relevant project checks, then the build/lint/typecheck gates required by the repository. Never claim a live result without measuring it.

## Safety

Do not modify `.env*`, secrets, workflows, or deployment settings without explicit authorization. Do not add third-party scripts or dependencies as an audit “fix.” Update the project mind after an implementation task, not after a read-only report unless the user asked for a record.
