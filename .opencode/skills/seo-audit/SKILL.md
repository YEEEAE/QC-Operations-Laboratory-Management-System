---
name: seo-audit
description: >
  Run a full website SEO audit across up to 500 pages, detect business type,
  coordinate the relevant BrightAI SEO skills, and produce a health score with
  prioritized findings. Use when the user wants a complete site review instead
  of a single-page check, including technical, content, schema, image, and
  indexing issues. Trigger on "audit", "full SEO check", "analyze my site",
  "website health check", تدقيق كامل, فحص شامل للموقع, تحليل موقعي, أو
  تقرير صحة الموقع.
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
  - WebFetch
---

# Full Website SEO Audit

## BrightAI Output Rules

For BrightAI tasks:
- Write the audit summary, issue lists, priorities, and recommendations in Arabic
- Keep URLs, schema keys, metric names, and code snippets in English
- Treat BrightAI as a Saudi, Arabic-first, bilingual site with static HTML, docs, blog, and local business signals

## Process

1. **Fetch homepage**: use `seo/scripts/fetch_page.py` to retrieve HTML
2. **Detect business type**: analyze homepage signals per seo orchestrator
3. **Crawl site**: follow internal links up to 500 pages, respect robots.txt
4. **Run the specialist checks** sequentially by default:
   - `seo-technical` -- robots.txt, sitemaps, canonicals, Core Web Vitals, security headers
   - `seo-content` -- E-E-A-T, readability, thin content, AI citation readiness
   - `seo-schema` -- detection, validation, generation recommendations
   - `seo-sitemap` -- structure analysis, quality gates, missing pages
   - `seo-images` -- alt text, formats, lazy loading, responsive image hygiene
   - `seo-geo` -- AI crawler access, llms.txt, citability, brand mention signals
   - `seo-local` -- GBP signals, NAP consistency, reviews, local schema, industry-specific local factors (run when Local Service signals appear)
5. **Score** -- aggregate into SEO Health Score (0-100)
6. **Report** -- generate prioritized action plan

Use parallel delegation only when the user explicitly requests sub-agents or parallel agent work and the environment allows it.

## Crawl Configuration

```
Max pages: 500
Respect robots.txt: Yes
Follow redirects: Yes (max 3 hops)
Timeout per page: 30 seconds
Concurrent requests: 5
Delay between requests: 1 second
```

## Output Mode

- Return the audit summary directly in the response by default.
- Create report files only when the user explicitly asks for saved artifacts.

## Scoring Weights

| Category | Weight |
|----------|--------|
| Technical SEO | 22% |
| Content Quality | 23% |
| On-Page SEO | 20% |
| Schema / Structured Data | 10% |
| Performance (CWV) | 10% |
| AI Search Readiness | 10% |
| Images | 5% |

## Report Structure

### Executive Summary
- Overall SEO Health Score (0-100)
- Business type detected
- Top 5 critical issues
- Top 5 quick wins

### Technical SEO
- Crawlability issues
- Indexability problems
- Security concerns
- Core Web Vitals status

### Content Quality
- E-E-A-T assessment
- Thin content pages
- Duplicate content issues
- Readability scores

### On-Page SEO
- Title tag issues
- Meta description problems
- Heading structure
- Internal linking gaps

### Schema & Structured Data
- Current implementation
- Validation errors
- Missing opportunities

### Performance
- LCP, INP, CLS scores
- Resource optimization needs
- Third-party script impact

### Images
- Missing alt text
- Oversized images
- Format recommendations

### AI Search Readiness
- Citability score
- Structural improvements
- Authority signals

## Priority Definitions

- **Critical**: Blocks indexing or causes penalties (fix immediately)
- **High**: Significantly impacts rankings (fix within 1 week)
- **Medium**: Optimization opportunity (fix within 1 month)
- **Low**: Nice to have (backlog)

## Error Handling

| Scenario | Action |
|----------|--------|
| URL unreachable (DNS failure, connection refused) | Report the error clearly. Do not guess site content. Suggest the user verify the URL and try again. |
| robots.txt blocks crawling | Report which paths are blocked. Analyze only accessible pages and note the limitation in the report. |
| Rate limiting (429 responses) | Back off and reduce concurrent requests. Report partial results with a note on which sections could not be completed. |
| Timeout on large sites (500+ pages) | Cap the crawl at the timeout limit. Report findings for pages crawled and estimate total site scope. |
