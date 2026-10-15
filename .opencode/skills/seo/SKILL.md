---
name: seo
description: >
  Perform comprehensive SEO analysis for websites, landing pages, SaaS products,
  local businesses, publishers, and e-commerce properties, including technical
  SEO, on-page SEO, schema validation, content quality, image optimization,
  sitemap analysis, Core Web Vitals, crawlability, indexability, and Generative
  Engine Optimization for AI Overviews, ChatGPT, and Perplexity citations. Use
  when the user asks for an SEO audit, page analysis, ranking improvement,
  search visibility review, indexing diagnosis, GEO optimization, or an overall
  organic growth plan. Trigger on requests mentioning SEO, audit, ranking,
  search console issues, indexing, crawlability, Core Web Vitals, E-E-A-T, AI
  search, تحسين محركات البحث, سيو, تدقيق SEO, فحص الموقع, تحليل الصفحة,
  الأرشفة, الفهرسة, تحسين الظهور, أو تحسين نتائج Google.
  "schema", "Core Web Vitals", "sitemap", "E-E-A-T", "AI Overviews", "GEO",
  "technical SEO", "content quality", "page speed", "structured data".
---

# SEO: Universal SEO Analysis Skill

Comprehensive SEO analysis across all industries (SaaS, local services,
e-commerce, publishers, agencies). Orchestrates the curated BrightAI SEO
skill set without external extensions.

## BrightAI Output Rules

For BrightAI tasks:
- Write all user-facing findings, reports, action plans, and recommendations in Arabic
- Keep code, schema keys, hreflang values, URLs, file paths, and identifiers in English
- Assume BrightAI is an Arabic-first Saudi website with `ar-SA` primary pages, `en-SA` companion pages, static HTML, docs, blog, and LocalBusiness signals unless the page clearly indicates otherwise
- Verify any dated market statistics, platform behavior claims, or study numbers from `references/` with current sources before quoting them as facts

## Quick Reference

| Command | What it does |
|---------|-------------|
| `/seo audit <url>` | Full website audit coordinated sequentially by default |
| `/seo page <url>` | Deep single-page analysis |
| `/seo sitemap <url or generate>` | Analyze or generate XML sitemaps |
| `/seo schema <url>` | Detect, validate, and generate Schema.org markup |
| `/seo images <url>` | Image optimization analysis |
| `/seo technical <url>` | Technical SEO audit (9 categories) |
| `/seo content <url>` | E-E-A-T and content quality analysis |
| `/seo geo <url>` | AI Overviews / Generative Engine Optimization |
| `/seo plan <business-type>` | Strategic SEO planning |
| `/seo local <url>` | Local SEO analysis (GBP, citations, reviews, map pack) |
| `/seo hreflang [url]` | Hreflang/i18n SEO audit and generation |

## BrightAI Project Fit

This skill set is a strong fit for BrightAI because the project combines:
- Arabic-first marketing pages with mixed Arabic/English terminology
- English companion pages using `en-SA` / `ar-SA` hreflang patterns
- A large blog and documentation surface that needs content governance
- Static HTML pages with embedded JSON-LD, FAQ, LocalBusiness, and service schema
- Strong local Saudi signals (Riyadh address, contact pages, sector pages, enterprise trust content)

When working on BrightAI, prioritize:
- Saudi Arabic wording quality over generic English SEO formulas
- Consistency between Arabic and English page pairs
- Schema truthfulness and deprecation checks on commercial pages
- Internal linking between service pages, docs, blog, and sector pages
- GEO readiness for enterprise AI, automation, and data analysis topics in Saudi Arabia

## Orchestration Logic

When the user invokes `/seo audit`, coordinate the core SEO checks:
1. Detect business type (SaaS, local, ecommerce, publisher, agency, other)
2. Run the specialist checks: seo-technical, seo-content, seo-schema, seo-sitemap, seo-images, seo-geo
3. Add seo-local when the page clearly targets local intent or shows strong GBP/address signals
4. Collect results and generate unified report with SEO Health Score (0-100)
5. Create prioritized action plan (Critical -> High -> Medium -> Low)

For individual commands, load the relevant sub-skill directly.

## Industry Detection

Detect business type from homepage signals:
- **SaaS**: pricing page, /features, /integrations, /docs, "free trial", "sign up"
- **Local Service**: phone number, address, service area, "serving [city]", Google Maps embed --> auto-suggest `/seo local` for deeper analysis
- **E-commerce**: /products, /collections, /cart, "add to cart", product schema
- **Publisher**: /blog, /articles, /topics, article schema, author pages, publication dates
- **Agency**: /case-studies, /portfolio, /industries, "our work", client logos

## Quality Gates

Read `references/quality-gates.md` for thin content thresholds per page type.
Hard rules:
- WARNING at 30+ location pages (enforce 60%+ unique content)
- HARD STOP at 50+ location pages (require user justification)
- Never recommend HowTo schema (deprecated Sept 2023)
- FAQ schema for Google rich results: only government and healthcare sites (Aug 2023 restriction); existing FAQPage on commercial sites -> flag Info priority (not Critical), noting AI/LLM citation benefit; adding new FAQPage -> not recommended for Google benefit
- All Core Web Vitals references use INP, never FID

## Reference Files

Load these on-demand as needed (do NOT load all at startup):
- `references/cwv-thresholds.md`: Current Core Web Vitals thresholds and measurement details
- `references/schema-types.md`: All supported schema types with deprecation status
- `references/eeat-framework.md`: E-E-A-T evaluation criteria (Sept 2025 QRG update)
- `references/quality-gates.md`: Content length minimums, uniqueness thresholds
- `references/local-seo-signals.md`: Local ranking factors, review benchmarks, citation tiers, GBP status
- `references/local-schema-types.md`: LocalBusiness subtypes, industry-specific schema and citation sources

## Scoring Methodology

### SEO Health Score (0-100)
Weighted aggregate of all categories:

| Category | Weight |
|----------|--------|
| Technical SEO | 22% |
| Content Quality | 23% |
| On-Page SEO | 20% |
| Schema / Structured Data | 10% |
| Performance (CWV) | 10% |
| AI Search Readiness | 10% |
| Images | 5% |

### Priority Levels
- **Critical**: Blocks indexing or causes penalties (immediate fix required)
- **High**: Significantly impacts rankings (fix within 1 week)
- **Medium**: Optimization opportunity (fix within 1 month)
- **Low**: Nice to have (backlog)

## Sub-Skills

This skill orchestrates 11 specialized sub-skills:

1. **seo-audit** -- Full website audit with parallel delegation
2. **seo-page** -- Deep single-page analysis
3. **seo-technical** -- Technical SEO (9 categories)
4. **seo-content** -- E-E-A-T and content quality
5. **seo-schema** -- Schema markup detection and generation
6. **seo-images** -- Image optimization
7. **seo-sitemap** -- Sitemap analysis and generation
8. **seo-geo** -- AI Overviews / GEO optimization
9. **seo-plan** -- Strategic planning with templates
10. **seo-hreflang** -- Hreflang/i18n SEO audit and generation
11. **seo-local** -- Local SEO (GBP, NAP, citations, reviews, local schema, multi-location)

## Audit Coverage

- `seo-technical` -- Crawlability, indexability, security, CWV
- `seo-content` -- E-E-A-T, readability, thin content
- `seo-schema` -- Detection, validation, generation
- `seo-sitemap` -- Structure, coverage, quality gates
- `seo-images` -- Alt text, formats, lazy loading, CLS risks
- `seo-geo` -- AI crawler access, llms.txt, citability, brand mention signals
- `seo-local` -- GBP signals, NAP consistency, reviews, local schema, industry-specific local factors (conditional when local intent is detected)

## Error Handling

| Scenario | Action |
|----------|--------|
| Unrecognized command | List available commands from the Quick Reference table. Suggest the closest matching command. |
| URL unreachable | Report the error and suggest the user verify the URL. Do not attempt to guess site content. |
| Sub-skill fails during audit | Report partial results from successful sub-skills. Clearly note which sub-skill failed and why. Suggest re-running the failed sub-skill individually. |
| Ambiguous business type detection | Present the top two detected types with supporting signals. Ask the user to confirm before proceeding with industry-specific recommendations. |
