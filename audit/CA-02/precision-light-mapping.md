# CA-02 — Precision Light → CAPA A mapping

`precision-light.css` remains in the cascade but is **inactive** for the authenticated
shell: `AppLayout.astro` declares `data-visual-direction="capa-a"`, and no route
declares `precision-light`. The table records the role-for-role translation so the
old direction can be read without treating it as the current palette.

| Semantic role | Precision Light (inactive) | CAPA A (active) | Same token? | Source |
|---|---|---|---|---|
| canvas | `#F3F6FA` | `#14181E` | yes (`--color-canvas`) | light: historical; dark: reference |
| canvas deep | `#EAF0F6` | `#101418` | yes | reference |
| panel | `#FFFFFF` | `#252B34` | yes (`--surface-panel`) | reference |
| raised / inset | `#F5F8FB` | `#2B323C` | yes (`--surface-raised`, `--surface-inset`) | reference |
| panel border | `#CBD7E1` | `#383F4C` | yes (`--border-default`) | reference |
| control border | `#7B8A99` | `#707A8C` | yes (`--control-border`) | measured in both directions; not a seed |
| text primary | `#14243B` | `#E8EDF5` | yes | reference |
| text secondary | `#344962` | `#C3CBD6` | yes | reference |
| text muted | `#53677D` | `#9BA3AF` | yes | reference |
| text inverse | `#FFFFFF` | `#14181E` | yes | reference |
| accent | `#087F8C` | `#92B8F2` | yes | reference |
| accent hover | `#086575` | `#A6C5F5` | yes | reference |
| accent active | — | `#7EA6E0` | new | derived, not in reference |
| focus | `#086575` | `#92B8F2` | yes (`--focus-ring`) | reference |
| warning / HOLD | `#86520B` | `#D5A36F` | yes (`--status-warning`) | reference warning seed |
| error / FAIL | `#A92C39` | `#E08585` | yes (`--status-error`) | approved dark palette, not a CAPA A seed |
| success / PASS | `#2A713E` | `#79AF70` | yes (`--status-success`) | approved dark palette, not a CAPA A seed |
| RELEASED | `#086575` | `#5FB3A6` | yes (`--status-released`) | measured adjustment of `#4F9B91`; see report |
| sidebar surface | `#111D2D` | `#111D2D` | unchanged | current product sidebar |
| sidebar text | `#F2F6F9` | `#F2F6F9` | unchanged | current product sidebar |
| sidebar accent | `#5DD0D7` | `#5DD0D7` | unchanged | current product sidebar |
| shadows | `0 2px 8px rgb(22 41 63 / 6%)` | `0 1px 2px rgb(0 0 0 / 24%)` | same token, different value | dark elevation; reference 5% was rejected as too faint on the dark panel |
| card radius | `12px` | `12px` | yes | reference |

## What did not carry over

- The light canvas, white panels, navy text and teal accent are replaced wholesale
  by the CAPA A palette.
- `precision-light.css` scoped sidebar overrides are not used; `capa-a.css` repeats
  the same sidebar values independently so the two directions cannot borrow each
  other by accident.
- The light-mode decorative `SystemBackground` wash is replaced by the CAPA A
  re-authoring in `capa-a.css`; the component itself keeps its static, script-free
  contract.
- `--surface-inset` and `--control-border` were added to `tokens.css` so both
  directions have a defined global fallback; before CA-02, `--control-border` was
  only declared inside `capa-a.css` while `login.astro` already consumed it.
