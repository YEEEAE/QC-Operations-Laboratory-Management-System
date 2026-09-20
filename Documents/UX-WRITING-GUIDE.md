# UX Writing Guide — QC Workspace

Applies to all user-facing text in `src/pages/**`, `src/ui/**`, and module-produced UI
strings. It governs presentation wording only; it never changes server authorization,
state machines, SoD, or the audit contract.

> Terminology governance lives in `Documents/COPY-GLOSSARY.md` (regulated terms, the five
> distinct lifecycle words, and the state-code→label table). Route-level copy surfaces are
> inventoried in `Documents/COPY-INVENTORY.md`. This guide remains the writing standard.

## 1. Principles

1. **Operational, not architectural.** Operators read outcomes and next actions, not
   implementation detail. No storage paths, SQL hints, HTTP methods, table names, or
   internal module names in user-visible copy.
2. **Short and action-led.** Prefer verbs over noun stacks. One idea per sentence.
   Cut helper text that repeats what the page already shows.
3. **Honest states.** An unavailable provider is never rendered as an empty list or a
   zero. Unavailable counts say they are withheld; empty views say why.
4. **One canonical phrase per concept.** Shared copy comes from
   `src/shared/copy/ux-vocabulary.ts`. Do not re-derive the same sentence inline.
5. **Sentence case everywhere**, including headings and buttons. No unnecessary
   uppercase (no decorative ALL-CAPS eyebrows except the protected dashboard identity
   pinned by the shell contract).
6. **Regulated terms stay exact.** `HOLD`, `PASS`, `FAIL`, `REJECTED`, `RELEASED`,
   `VOID`, `NCR`, `CAPA`, and release boundary wording keep their controlled meaning
   and casing. Never rename, translate, or soften them.
7. **Separate the controlled facts.** Receiving state, inspection result, and release
   state stay visually and verbally distinct. `PASS` is a scientific result, not a
   release. Backup job state is not restore evidence.
8. **Errors name the class, not the stack.** Validation, authorization, stale record,
   dependency, duplicate, and outage each have their own message (see §4).
9. **English-only UI.** English LTR is the approved product language for this baseline.
   Do not introduce Arabic/RTL scope without an approved localization decision.

## 2. Status and state labels

- Raw enum values (`UNDER_REVIEW`, `OUT_OF_SERVICE`, …) never render directly in pages.
  Use `stateLabel(code)` from `src/shared/copy/ux-vocabulary.ts` for sentence-case
  human labels.
- Regulated codes render exactly: `PASS`, `FAIL`, `HOLD`, `RELEASED`, `VOID`
  (`stateLabel` already keeps them uppercase; `E2E` fixtures and `audit` parity depend
  on this).
- `releaseStateLabel(boolean)` renders `RELEASED` / `Not released`; the receiving
  register and detail pages must keep the `RELEASED`/`NOT_RELEASED` distinction inside
  the facts block.
- Severity uses `severityLabel()` → `Minor`, `Major`, `Critical`. Unclassified rows
  read `Not classified`, never a fake value.
- History transitions use `transitionLabel(from, to)` so no transition ever renders
  “Not set → Not set”.

## 3. Identifiers

- Human identifiers first: receiving number, finding number, calibration number,
  document number. A raw UUID may appear in a monospace metadata slot, never as the
  row heading or the only label.
- Column headings say “Equipment number”, “Calibration number”, “Maintenance number”
  — not “ID”.
- Never ask operators to type a technical identifier (UUIDs, numeric keys). Offer a
  picker (see the `Browse members` pattern in the admin scopes form).

## 4. Error copy by class

Canonical map: `uxVocabulary.errorClasses`. Per-form overrides may refine the subject
but must keep the class distinction:

| Class | Message must say |
| --- | --- |
| `VALIDATION_ERROR` | Which fields to review; entries preserved |
| `AUTHORIZATION_CHANGED` | Authority changed; entries preserved; who to contact |
| `CONFLICT_STALE` | Record changed after opening; reload; nothing resubmitted |
| `DEPENDENCY_UNAVAILABLE` | Referenced record unavailable; check current state |
| `DUPLICATE_COMMAND` | Action already applied; reload to see current state |
| `UNKNOWN_SAFE_ERROR` | Action did not complete; nothing changed; retry is safe |

Forbidden: “Something went wrong”, “An error occurred”, “Unexpected error”, “Try
again later” as a complete message, any copy that blames the user or exposes a stack
trace, SQL, provider name, or secret.

## 5. Empty, loading, and unavailable states

- Empty (confirmed): state what the view is and what to do next
  (`No findings match this view` → clear the filter or create).
- Unavailable: use `ProviderUnavailableState`; the message says data is withheld, not
  that nothing exists. Counts stay absent.
- Loading: mutations use the shared `enhanceMutationForm` progress text pattern
  (`Saving…`, `Creating user…`, `Recording restore request…`).
- Never render an empty chart, a zero, or “0 results” for an unavailable read.

## 6. Boundaries the copy must keep

- `passNotRelease` — PASS does not release the item.
- `backupNotRestoreProof` — a verified backup is not a verified restore.
- `aiNotAuthority` — AI output is advisory only; it cannot approve, reject, release,
  or sign.
- Restore request pages never say or imply that a restore executes.
- Permission denials name the required explicit permission; role membership alone is
  never described as authorization.

## 7. Review checklist

1. No raw enum in visible text (search for `[A-Z]{2,}_[A-Z]{2,}` outside controlled
   terms).
2. No duplicated lede/eyebrow text between page head and panel headers.
3. No “ID” column headings where a human number exists.
4. Errors distinguish all six classes or intentionally share the exact pinned text.
5. Accessible names still match visible labels (label-in-name), and status words keep
   their exact casing.
6. Accessibility checks re-run after copy changes: accessible names, label-in-name,
   and aria-label descriptions change when the text changes.
