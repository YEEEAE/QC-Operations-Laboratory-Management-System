---
name: heading-structure
description: "Design heading hierarchies and content structure that work for screen readers and cognitive accessibility. Use when structuring pages, articles, dashboards, forms, or any content-heavy interface. Triggers on: headings, heading hierarchy, h1 h2 h3, content structure, page structure, screen reader navigation, document outline, semantic structure, heading levels."
---

# Heading Structure

Headings are navigation for screen reader users and cognitive signposts
for everyone. A clear heading structure is the difference between
content people can find and content people abandon.

## Why This Matters

Screen reader users navigate by headings — they press a key to jump
between headings the way sighted users scan a page visually. If your
heading structure is broken, screen reader users are lost in a wall
of undifferentiated text.

For people with cognitive disabilities, headings are the primary way
they understand what content a page contains and where to find what
they need.

## Rules

### One H1 Per Page
- The H1 is the page title — what this page is about
- It should match or closely relate to the page's title tag and
  the link that brought the user here
- Never use more than one H1 on a page

### No Skipped Levels
- Go H1 → H2 → H3, never H1 → H3
- Skipping levels breaks screen reader navigation and confuses
  the document outline
- You can go back up: H3 → H2 is fine (starting a new section)

### Headings Describe Content
- Headings are signposts, not decoration
- "Your Account Settings" not "Section 2"
- "Choose a Delivery Date" not "Step 3"
- A user should understand the page's content by reading only
  the headings

### Headings Are Not Visual Styling
- Don't use a heading tag just to make text big or bold
- Don't skip heading tags and just style text to look like a heading
- The tag determines the structure; CSS determines the appearance
- If it looks like a heading but isn't one, screen reader users
  can't find it

## Recommended Depth

- Most pages: H1 through H3 is sufficient
- Complex pages: H1 through H4 maximum
- If you need H5 or H6: the page is probably too complex —
  consider splitting it

## Patterns

### Article or Blog Post
```
H1: Article Title
  H2: First Major Section
    H3: Subsection
    H3: Subsection
  H2: Second Major Section
    H3: Subsection
  H2: Conclusion
```

### Dashboard
```
H1: Dashboard Name
  H2: Summary / Key Metrics
  H2: Recent Activity
  H2: Tasks
  H2: Notifications
```

### Form
```
H1: Form Title (e.g., "Apply for an Account")
  H2: Personal Information
  H2: Contact Details
  H2: Preferences
  H2: Review and Submit
```

### Settings Page
```
H1: Settings
  H2: Profile
  H2: Notifications
  H2: Privacy
  H2: Billing
```

## Assessment Checklist

- [ ] Exactly one H1 per page
- [ ] No skipped heading levels
- [ ] Headings describe the content beneath them
- [ ] Heading tags are used for structure, not visual styling
- [ ] A user reading only headings would understand the page
- [ ] Heading depth does not exceed H4
