# Internal Links Scan Report Template

Use this template when summarizing audit or repair work.

```text
=== INTERNAL LINKS SCAN REPORT ===
Trigger: [what caused this scan]
Files Scanned: [number]
References Checked: [number]
Issues Found: [number]
Issues Fixed: [number]
Issues Requiring Manual Review: [number]

--- FIXED ---
[source_file:line] -> [type]: [old_path] -> [new_path]

--- NEEDS MANUAL REVIEW ---
[source_file:line] -> [type]: [description of issue]

--- WARNINGS ---
[non-breaking issues, risky assumptions, convention mismatches]
=== END REPORT ===
```

If a section has no entries, write `None`.
