---
name: accessible-content-review
description: "Review content for accessibility across cognitive and literacy levels. Chains: readable-content, alt-text-design, heading-structure, link-text-design, table-accessibility, form-labelling, multimedia-accessibility. Use when auditing existing content for accessibility."
---

# Accessible Content Review

Run a comprehensive review of content accessibility — covering
structure, language, images, links, tables, forms, and multimedia.

## Process

### Phase 1: Structure Check
Using **heading-structure**, verify the document outline:
- One H1, no skipped levels, headings describe content
- Someone reading only headings would understand the page

### Phase 2: Readability Check
Using **readable-content**, assess the text:
- Reading level appropriate to audience
- Sentences under 20 words, paragraphs under 4 sentences
- Most important information first
- Scannable with headings, bold, and lists

### Phase 3: Image and Media Check
Using **alt-text-design** and **multimedia-accessibility**, review:
- Every image has appropriate alt text (or empty alt for decorative)
- Complex images have extended descriptions
- Video has captions, audio has transcripts
- Media players are keyboard accessible

### Phase 4: Link and Navigation Check
Using **link-text-design**, verify:
- All link text makes sense out of context
- No generic "click here" or "read more"
- File links state type and size

### Phase 5: Table and Form Check
Using **table-accessibility** and **form-labelling**, review:
- Tables have headers, captions, and responsive behaviour
- Forms have visible labels, grouping, and error association
- No placeholder-only labels

## Output

Present findings as:

1. **Summary** — overall content accessibility rating
2. **Issue list** — each issue with location, type, severity, and fix
3. **Quick wins** — issues that can be fixed in under 5 minutes each
4. **Structural issues** — problems that need redesign or rewriting

Severity definitions:
- **Critical** — content is inaccessible to one or more user groups
- **Major** — content is difficult to access or understand
- **Minor** — content could be improved but is functional
