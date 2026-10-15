---
name: accessible-content-structure
description: "Structure content for screen reader and assistive technology use. Chains: heading-structure, alt-text-design, table-accessibility, form-labelling. Use when building a new page, document, or content template and you want to get the structural accessibility right from the start."
---

# Structure for Assistive Technology

Build content structure that assistive technology can parse, navigate,
and present meaningfully — so the structure you designed is the
structure every user experiences.

## Process

### Step 1: Define the Document Outline
Using **heading-structure**, design the heading hierarchy:
- One H1 describing the page purpose
- H2s for major sections
- H3s for subsections within those
- Verify: does reading only the headings tell the full story?

### Step 2: Identify Landmarks
Map the page regions that assistive technology uses for navigation:
- banner — site header and branding
- navigation — primary and secondary nav
- main — the primary content area
- complementary — sidebars and related content
- contentinfo — footer
- search — search functionality
- form — significant forms (use aria-label to distinguish multiples)

Every page should have at minimum: banner, navigation, main, contentinfo.

### Step 3: Structure Images and Media
Using **alt-text-design**, assign alt text strategy for every image:
- Decorative: empty alt
- Functional: alt describes the action
- Informative: alt describes the information
- Complex: short alt plus extended description

### Step 4: Structure Data
Using **table-accessibility**, for every table:
- Assign headers with proper scope
- Add caption describing the table's content
- Plan responsive behaviour for small screens

### Step 5: Structure Forms
Using **form-labelling**, for every form:
- Associate every input with a visible label
- Group related fields with fieldset/legend
- Plan error message association
- Define required field indication strategy

### Step 6: Define Reading Order
- Verify that the DOM order matches the visual order
- Content should make sense when read linearly top to bottom
- Avoid CSS that visually rearranges content away from DOM order
- Tab order should follow reading order

## Output

Deliver a structural specification that includes:
- Document outline (heading hierarchy)
- Landmark map
- Image alt text strategy per image type
- Table structure specification
- Form labelling specification
- Reading order confirmation
