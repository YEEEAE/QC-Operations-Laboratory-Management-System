---
name: table-accessibility
description: "Design data tables that work for screen readers and cognitive accessibility. Use when creating or reviewing tables, data grids, comparison tables, pricing tables, or any tabular data. Triggers on: table, data table, grid, spreadsheet, comparison table, pricing table, screen reader table, table headers, scope, caption, complex table."
---

# Table Accessibility

Design tables that communicate structure and relationships — not just
to sighted users scanning rows and columns, but to screen reader users
who navigate one cell at a time.

## When to Use a Table

Tables are for data that has relationships across two dimensions (rows
and columns). Don't use tables for layout.

- Use a table: comparing features across products, showing schedules,
  displaying data with consistent categories
- Don't use a table: laying out a form, arranging cards, creating
  visual columns of unrelated content

## Core Requirements

### Every Table Needs Headers
- Column headers: use <th> with scope="col"
- Row headers: use <th> with scope="row"
- Screen readers announce headers before each cell, so users always
  know which column and row they're in
- Without headers, a screen reader user hears a stream of disconnected
  values with no context

### Every Table Needs a Caption or Label
- Use <caption> element for HTML tables
- Or use aria-labelledby pointing to a visible heading
- The caption describes what the table contains:
  "Pricing comparison for Standard, Pro, and Enterprise plans"
- Not just "Table 1" or "Data"

### Simple Tables Over Complex Tables
- Prefer simple tables with one row of column headers
- Avoid merged cells (colspan, rowspan) wherever possible
- If merged cells are necessary, use proper headers/id/scope
  associations
- If a table needs merged cells to make sense, consider whether
  it should be split into multiple simpler tables

## Cognitive Accessibility for Tables

### Visual Design
- Zebra striping (alternating row colours) aids row tracking
- Adequate cell padding (at least 8px) prevents crowding
- Align numbers right, text left for readability
- Highlight the header row with stronger contrast

### Reduce Complexity
- Maximum 5–7 columns for comfortable scanning
- If more columns are needed, consider a different format
  or allow users to show/hide columns
- Provide a summary or key takeaway above complex tables
- Don't require horizontal scrolling — make tables responsive

### Responsive Tables
- On small screens: convert to card/list view where each row
  becomes a labelled card
- Or allow horizontal scroll with a sticky first column
- Never hide data on smaller screens without a way to access it
- Test: can a mobile user access every piece of data?

## Assessment Checklist

- [ ] All tables have column and/or row headers with proper scope
- [ ] All tables have a caption or accessible label
- [ ] No merged cells (or properly associated headers if unavoidable)
- [ ] Tables are responsive on small screens
- [ ] Tables are not used for visual layout
- [ ] Complex tables have a text summary of key findings
- [ ] Cell padding and spacing support readability
