# CA-02 — defaults and derived values not yet accepted

These values are implemented because a readable, testable layer needs them, but
they are **not** claimed as reference fidelity or owner-approved design decisions.
Each item names the evidence that would close it.

| # | Value / decision | Where | Why it is not accepted | What would close it |
|---|---|---|---|---|
| 1 | pressed accent `#7EA6E0` | `capa-a.css` `--color-accent-primary-active` | derived from the reference accent; the reference proves rest, hover and focus only | owner/design review of pressed state, or a reference frame with pressed |
| 2 | secondary pressed `#303845` | `capa-a.css` `--color-surface-active` | derived neutral; no reference frame | same as above |
| 3 | disabled opacity `0.55`, busy opacity `0.85` | `capa-a.css` + `tokens.css` | derived affordances; reference has no disabled/busy control | design-system decision on disabled/busy treatment |
| 4 | control boundary `#707A8C` | `capa-a.css` `--control-border` | deliberate accessibility delta from reference `#383F4C` (1.68:1) to reach 3.29:1 | owner accepts the stronger boundary, or supplies an approved border token |
| 5 | RELEASED `#5FB3A6` | `capa-a.css` `--status-released` | measured adjustment of approved `#4F9B91` (3.98:1 → 5.26:1 on released bg); not a CAPA A seed | palette owner confirms the adjusted teal |
| 6 | warning `#D5A36F`, error `#E08585`, success `#79AF70` | `capa-a.css` status block | taken from the existing dark system because the CAPA A reference has no green/red/teal status seeds | status palette approval; CAPA A does not prove these |
| 7 | card shadow `0 1px 2px rgb(0 0 0 / 24%)` | `capa-a.css` `--shadow-1` | reference uses 5%; the darker value was chosen for the product’s dark panel; not measured as a fidelity requirement | visual review; reference shadow may be accepted instead |
| 8 | topbar uses the panel surface | `capa-a.css` `.app-topbar` | the reference is an isolated canvas with no product topbar | product design decision on topbar treatment |
| 9 | `.state-card` max width 720px | `capa-a.css` | reference confirms 720px for the blocker/short-form card; it is not a general content width | already reference-confirmed; keep out of dense registers |
| 10 | print palette white/`#111`/`#999` | `capa-a.css` print block | print is a product requirement, not a reference state; the layer chooses ink-light output | print/records owner review of printed records |
| 11 | `--surface-inset` alias = `--color-surface-2` | `tokens.css`, `precision-light.css`, `capa-a.css` | semantic name added by CA-02; the primitive already existed | design-system naming review |
| 12 | `--control-border` fallback = `--color-border-strong` | `tokens.css` | global fallback added so pages outside `capa-a` resolve the token; the value is not a reference seed | design-system token review |
| 13 | link hover stays `#A6C5F5` and the base link is also `#A6C5F5` | `capa-a.css` | the layer does not invert link luminance on hover; reference only proves one link colour pair | interaction-state review |
| 14 | `Inter` resolves from the local machine | `global.css` `@font-face` | project has no bundled WOFF2; `local('Inter')` falls back to platform sans if absent. No download was added | bundle an approved WOFF2 if exact Inter rendering is required |
| 15 | 32 sidebar links / 264px real track | `AppLayout.astro` + `Sidebar.astro` | these are product facts, not CAPA A design values; the exploration rail was not copied | no action; preserve unless navigation changes by product decision |

## Explicit non-claims

- No WCAG AA conformance claim for the 86-route surface; only the measured pairs
  and the sampled axe scans in `report.md`.
- No claim that the reference contains green/red/teal status seeds.
- No claim that `PASS`, `APPROVED` or `LAYER_APPLIED` means released, effective or
  accepted.
- No claim that screenshots were retained; they were reviewed and deleted at the
  user’s request. The measured JSON evidence remains.
