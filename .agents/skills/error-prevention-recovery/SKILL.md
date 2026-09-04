---
name: error-prevention-recovery
description: "Design error prevention, error messages, and recovery flows for cognitive accessibility. Use when designing forms, checkout flows, account creation, settings, data entry, or any flow where users can make mistakes. Triggers on: error handling, error messages, form errors, validation, users make mistakes, users abandon, error recovery, undo, forgiving design."
---

# Error Prevention and Recovery

Design systems that prevent errors before they happen, and when errors
do occur, help people recover without shame, confusion, or lost work.

## Prevention Strategies

### Forgiving Input
- Accept multiple date formats ("15/03/2026", "15 March 2026", "March 15, 2026")
- Accept multiple phone formats ("(555) 123-4567", "555-123-4567", "5551234567")
- Auto-format as the user types
- Case-insensitive matching
- Trim whitespace automatically
- Show format examples next to fields ("e.g., 15/03/2026")

### Smart Defaults
- Pre-select the most common option
- Pre-fill known information (name from account, address from postcode)
- Show the recommended choice for complex decisions
- Default to the safest option for irreversible settings

### Progressive Validation
- Validate each field when the user moves to the next (on blur)
- Show success states for correctly completed fields
- Never validate while the user is still typing
- Never clear user input on error — always preserve their work

### Minimal Demands
- Only ask for information you strictly need
- Mark optional fields, not required ones (most fields should be required
  by design — if they aren't needed, remove them)
- Break long forms into steps with clear progress

## Error Message Design

Every error message must answer three questions:
1. **What happened?** (specific, not generic)
2. **Why?** (in plain language)
3. **What do I do now?** (a clear, single action)

### Examples

**Bad:** "Invalid input"
**Good:** "Please enter a date in the format DD/MM/YYYY — for example, 15/03/2026"

**Bad:** "Error 403"
**Good:** "You don't have permission to view this page. Contact your team admin to request access."

**Bad:** "Password does not meet requirements"
**Good:** "Your password needs at least 8 characters and one number. You have 6 characters."

### Error Message Tone
- Never blame the user ("You entered an invalid email")
- State the situation neutrally ("We need a valid email to continue")
- Be specific about what needs to change
- Offer an alternative path when possible

## Recovery Design

- **Undo** available for at least 10 seconds after any action
- **Confirmation** before destructive actions with useful detail:
  "Delete 'Project Alpha'? This removes all 23 files. This cannot be undone."
- **Preview** before submission for any consequential action
- **Save progress** automatically in long flows
- **Alternative path** when primary path fails:
  "Can't upload a photo? You can describe what you see instead."
