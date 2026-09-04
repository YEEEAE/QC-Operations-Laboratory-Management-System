---
name: intelligent-content-reviewer-validator
description: Review and validate changed content for logical flow, contextual consistency, structure, clarity, tone, redundancy, and cross-reference accuracy after any content creation or edit. Use when Codex writes or updates UI copy, documentation, landing-page text, localized content, README files, section rewrites, merged sections, translated text, or other user-facing wording, and needs to catch integrity issues safely with minimal edits. Trigger on requests about reviewing copy, refining wording, validating content quality, تدقيق المحتوى, مراجعة النصوص, تحسين الصياغة, التحقق من الاتساق, أو فحص المحتوى بعد التعديل.
---

# Intelligent Content Reviewer & Validator

## Overview

Act as the project's content integrity guardian after any content change. Review the changed material, inspect surrounding context, fix clear issues with minimal targeted edits, and produce a structured integrity report.

Prefer small repairs over rewrites. Preserve author intent, avoid inventing facts, and flag ambiguous or domain-sensitive issues instead of guessing.

## Review Workflow

### 1. Analyze the change

- Identify exactly what content was added, removed, moved, translated, or rewritten.
- Read the changed content in full before editing.
- Determine the content's purpose: inform, instruct, persuade, describe, document, or support UI behavior.
- Determine the target audience and tone from nearby content.

### 2. Gather context

- Read the immediately preceding and following sections.
- Read the parent document's introduction, structure, and conclusion when relevant.
- Inspect related files when the change affects navigation, duplicated concepts, cross-links, glossary terms, FAQs, README, CHANGELOG, or localized copies.
- Build a quick map of incoming and outgoing references that touch the changed content.

### 3. Run the review

Check the content at four levels:

#### Logical flow

- Ensure each paragraph has one clear idea and transitions naturally.
- Ensure each section heading matches the section's actual promise.
- Ensure the document still progresses logically from start to finish.
- Flag abrupt topic jumps, repeated ideas, and missing bridges.

#### Contextual consistency

- Keep terminology, abbreviations, product names, and feature names consistent across files.
- Ensure facts, versions, dates, stats, steps, and references match surrounding sources.
- Match the established tone, formality, and point of view.

#### Structural integrity

- Validate heading hierarchy and numbering.
- Validate promised items, step counts, table completeness, FAQ answer coverage, and appendix or glossary completeness.
- Verify that "see above", "see below", "as mentioned earlier", and similar references are actually true.

#### Content quality and reasoning

- Flag sentences longer than about 35 words when clarity suffers.
- Flag paragraphs longer than about 8 sentences when readability suffers.
- Flag ambiguous pronouns, duplicate content, placeholder text, empty sections, broken links, missing alt text, and incomplete examples.
- For arguments, comparisons, and tutorials, verify the reasoning chain, prerequisite order, fairness of comparison, and safety-warning placement.

### 4. Repair safely

- Fix what is clearly correctable without changing meaning.
- Add short transitions where flow is broken.
- Harmonize terminology with the project's dominant usage.
- Repair headings, numbering, internal references, and obvious duplication.
- Do not silently rewrite domain facts that may require subject-matter confirmation; flag them instead.

### 5. Re-verify integration

- Confirm the change does not contradict nearby or related content.
- Confirm the new content does not make older sections redundant without cleanup.
- Confirm navigation, TOC, sitemap mentions, and cross-references still make sense when relevant.
- Run a second pass after edits to ensure the repair did not introduce new inconsistencies.

## Severity Rules

- `CRITICAL`: factual contradiction, dangerous instructions, missing critical prerequisite or warning, content that conflicts with product reality, broken logic, or visible placeholder text.
- `HIGH`: terminology inconsistency that confuses readers, missing tutorial step, incorrect section placement, tone clash, missing forward reference target, or incomplete comparison.
- `MEDIUM`: overly long sentences or paragraphs, vague headings, missing transitions, minor ambiguity, or avoidable redundancy.
- `LOW`: polish improvements, sharper wording, stronger examples, or optional cross-links.

## Repair Principles

- Never delete content until its purpose is understood.
- Never change meaning; improve expression and integration only.
- Preserve the author's intent and local writing style.
- Prefer minimal targeted edits over broad rewrites.
- Prefer adding a bridge sentence over restructuring a full section.
- If a possible mistake may be intentional, verify first or flag it.
- If technical accuracy is uncertain, flag it instead of fabricating a fix.
- Keep the workflow idempotent: a second pass should produce the same result.

## Special Cases

### API documentation

- Ensure request and response examples match the endpoint description.
- Ensure parameter types, constraints, auth requirements, version markers, and error codes are consistent.

### Changelogs and release notes

- Ensure reverse chronological order, version consistency, clear breaking-change markers, and valid migration guidance.

### User-facing UI text

- Ensure buttons describe the action.
- Ensure errors explain what happened and what to do next.
- Ensure confirmations state the consequence.
- Ensure empty, loading, and success states set correct expectations.

### Localization

- Ensure translated meaning matches the source.
- Ensure locale formatting for dates, numbers, and currency is appropriate.
- Flag untranslated strings and missing mirrored sections.

## Output Format

After every review cycle, produce this exact structure with concise entries:

```text
=== CONTENT INTEGRITY REPORT ===
Trigger: [what caused this review]
Content Reviewed: [files/sections affected]
Review Depth: [paragraph / section / document / project-wide]

--- CRITICAL ISSUES (must fix) ---
[file:location] [ISSUE_TYPE]: [description] -> Fix applied: [what was done]

--- HIGH ISSUES (should fix) ---
[file:location] [ISSUE_TYPE]: [description] -> Fix applied: [what was done]

--- MEDIUM ISSUES (quality improvement) ---
[file:location] [ISSUE_TYPE]: [description] -> Fix applied: [what was done]

--- LOW ISSUES (polish) ---
[file:location] [ISSUE_TYPE]: [description] -> Fix applied: [what was done]

--- INTEGRATION SUMMARY ---
New content fits: [yes/no - brief reason]
Flow preserved: [yes/no - brief reason]
Consistency maintained: [yes/no - brief reason]
Cross-references valid: [yes/no - brief reason]

--- STATISTICS ---
Issues Found: [number by severity]
Issues Auto-Fixed: [number]
Issues Needing Manual Review: [number]
Content Quality Score: [1-10 with brief justification]
=== END REPORT ===
```

If a severity bucket has no issues, write `None`.

## Trigger Reminders

Run this skill whenever content is created, modified, reorganized, translated, merged, moved, or updated, including:

- new sections, pages, paragraphs, FAQs, glossary entries, appendices, media descriptions, and captions
- navigation, table of contents, sitemap, README, CHANGELOG, and other documentation edits
- updated statistics, references, UI text, notifications, and error messages

When the content change is small, keep the review narrow but still inspect immediate surrounding context. When the change affects terminology, navigation, structure, or shared facts, expand the review to related files.
