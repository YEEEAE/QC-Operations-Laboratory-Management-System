---
name: form-labelling
description: "Design form labels, instructions, and grouping that work for screen readers and cognitive accessibility. Use when designing or reviewing forms, input fields, checkboxes, radio buttons, select menus, or any data entry interface. Triggers on: form label, label, input label, fieldset, legend, placeholder, form instructions, form group, radio group, checkbox group, required field, form accessibility."
---

# Form Labelling

Every form field needs a visible, persistent label that is
programmatically associated with the input. This is the single most
common accessibility failure on the web — and the easiest to fix.

## Core Rules

### Every Input Has a Visible Label
- Use <label> element with for/id association
- The label must be visible at all times — not just as placeholder
  text that disappears on focus
- Labels go above the input (most accessible and most scannable)
- Never use placeholder text as the only label — it disappears
  when the user starts typing

### Labels Describe What to Enter
- Good: "Email address"
- Bad: "Enter your info here"
- Good: "Date of birth (DD/MM/YYYY)"
- Bad: "Date"
- Include format hints in the label or help text, not just in
  placeholder

### Required Fields Are Clear
- Mark required fields with visible text: "required" or *
- If using *, explain it at the top of the form: "* = required"
- Use aria-required="true" for programmatic indication
- Better: make most fields required by design and mark the
  optional ones instead — "Company name (optional)"

## Grouping Patterns

### Related Fields Need Fieldsets
- Group related fields with <fieldset> and <legend>
- Radio buttons: always group with fieldset
  - Legend: "Preferred contact method"
  - Options: Email, Phone, Text
- Checkboxes: group when they share a question
  - Legend: "Which topics interest you?"
  - Options: Design, Engineering, Product
- Address fields: group under "Delivery address" or "Billing address"

### When You Have Multiple Forms
- Each form section should have a heading or legend
- Sections should be visually and structurally separated
- Progress indicators help users understand where they are

## Instruction Patterns

### Help Text
- Place help text between the label and the input
- Associate with aria-describedby so screen readers announce it
- Good: "Must be at least 8 characters with one number"
- Keep instructions concise — one sentence

### Error Association
- Error messages must be programmatically linked to the field
  (aria-describedby or aria-errormessage)
- Place error text directly below the field, not in a remote banner
- Include the field label in the error: "Email address: please
  enter a valid email"

## Common Mistakes

- Placeholder as label — disappears on input, invisible to many
  screen readers
- Icon-only labels — a magnifying glass without text "Search" label
- Labels far from inputs — spatial separation breaks the visual
  association
- Labels that change — don't change label text based on input state
- Unlabelled buttons — every button needs visible text or aria-label

## Assessment Checklist

- [ ] Every input has a visible <label> associated with for/id
- [ ] No placeholder-only labels
- [ ] Required fields are indicated visually and programmatically
- [ ] Related fields are grouped with fieldset/legend
- [ ] Help text is associated with aria-describedby
- [ ] Error messages are linked to their field
- [ ] All buttons have visible text labels
