
# MASTER HEADER

حطه في بداية كل برومبت:

```text
@Superpowers
@GitHub

REPOSITORY:
YEEEAE/QC-Operations-Laboratory-Management-System

MODEL:
GPT-5.6 Luna

MISSION:
Close only the remaining evidence-backed blockers from the latest
audit/100-percent audit.

DO NOT redo completed work blindly.

AUTHORITATIVE SOURCES:
1. Current working tree
2. Current GitHub main
3. Current source code
4. Current automated test results
5. Current runtime evidence
6. audit/100-percent/**
7. Documents/**
8. Historical claims last

BEFORE ANY CHANGE:

Run and record:

pwd
git branch --show-current
git rev-parse HEAD
git status --short
git diff --stat
git diff
node --version
pnpm --version

Read completely:

audit/100-percent/FINAL-100-DOMAIN-AUDIT.md
audit/100-percent/FINAL-OPEN-RISKS.md
audit/100-percent/FINAL-PRODUCTION-DECISION.md
audit/100-percent/FINAL-EVIDENCE-INDEX.md
audit/100-percent/02-GAP-REGISTER.md
audit/100-percent/04-CRITICAL-BLOCKERS.md

Also read every relevant source/specification before modifying it.

CRITICAL:

Do not reuse the SHA written inside old audit reports as current reality.
Always calculate the current HEAD again.

100% is a target, never an assumption.

Never report:
100%
READY
COMPLETE
PASS
PRODUCTION READY
FIXED
CLOSED

without fresh evidence for the exact current HEAD.

USE:

systematic-debugging before fixing failures.
TDD for behavior changes.
verification-before-completion before any completion claim.

SECURITY:

Never print or commit:
DATABASE_URL
passwords
session secrets
provider tokens
API keys
private file URLs
production credentials

Never weaken:
authorization
CSP
RBAC
scope controls
database integrity
audit controls
state machines
file security

to make tests pass.

DO NOT:
push
merge
deploy
modify production
rotate production credentials
run production write operations

unless the individual prompt explicitly permits it.

After implementation:

pnpm format:check
pnpm lint
pnpm typecheck

plus all relevant focused and regression tests.

Run:

git diff --check

Inspect final diff.

FINAL RESPONSE:

TASK:
HEAD:
ROOT CAUSE:
CHANGES:
FILES:
TESTS:
EVIDENCE:
PASS/FAIL:
REMAINING BLOCKERS:
UPDATED RISK IDs:
SUGGESTED COMMIT MESSAGE:

STOP after this task.
```



---

# 08 — القرارات العلمية والسياسات

هذا أحد الأشياء اللي **ما ينفع Codex يخترعها**.

```text
TASK ID:
QC-100-CLOSURE-08

TITLE:
Controlled Scientific and Business Policy Decision Closure

MODE:
POLICY TRACEABILITY + FAIL-CLOSED IMPLEMENTATION

MISSION:

Resolve R-007 without inventing business/scientific authority.

Search all:

Documents/**
src/**
tests/**
audit/**

for unresolved policy-dependent decisions including:

scientific limits
acceptance criteria
test methods
precision
rounding
retest policy
release authority
approval authority
SoD authority
document effective-date rules
retention
archival
RPO
RTO
escalation
master data ownership
AI usage authority.

CREATE:

audit/100-percent/CONTROLLED-POLICY-DECISION-REGISTER.md

For every unresolved item record:

ID
domain
decision
why required
current behavior
current source
risk
system default
required approver/source
implementation impact
tests required
status.

RULE:

Until a policy is approved:

the software must fail closed.

Examples:

No approved scientific limit
→ do not invent PASS/FAIL threshold.

No release authority
→ do not permit release.

No retest policy
→ block or require controlled override according to approved existing rule.

No retention rule
→ do not invent automatic deletion.

If approved source already exists in repository:
trace it and implement/test it.

If it does not:
do not close that item.

Generate a concise operator checklist listing ONLY decisions that require
actual QC/QMS/business approval.

After approved decisions are supplied:
implement with TDD
add negative tests
update traceability.

Close R-007 only when applicable critical decisions have approved controlled
sources and executable evidence.
```

---

# 09 — AI Provider + Model Risk + Human in Loop

```text
TASK ID:
QC-100-CLOSURE-09

TITLE:
Live AI Provider, Model Risk and Human-in-the-Loop Closure

MODE:
AI RUNTIME VERIFICATION
NO CONTROLLED AUTHORITY EXPANSION

MISSION:

Resolve R-008 only if AI Advisory is part of intended production scope.

Current deterministic AI evals are useful but do not prove a deployed provider.

FIRST:

Inspect:

src/modules/ai-advisory/**
AI provider abstraction
DisabledAiProvider
current AI tests
deterministic eval dataset
security architecture.

CRITICAL INVARIANTS:

AI can advise only.

AI must never:

approve
reject officially
release
sign
change official PASS/FAIL
change controlled state
bypass RBAC
bypass scope
write official record directly.

PROVIDER:

Implement/configure provider only through approved environment secrets.

Never hardcode API keys.

Test:

provider success
timeout
network outage
rate limit
malformed response
unsafe authority language
prompt injection
fake scientific limit
invented SOP/WI
cross-scope data request
secret-like input
oversized input
provider error
fallback.

HUMAN-IN-THE-LOOP:

Every AI recommendation must remain clearly advisory.

User must know:

what AI suggested
that it is non-authoritative
what controlled source remains authoritative.

Ensure reviewer/action path goes through normal application authorization
and business rules.

OBSERVABILITY:

Record safe provider outcome metadata without storing uncontrolled sensitive
prompt content.

EVALS:

Expand deterministic suite only based on actual threat/model-risk cases.

If provider is intentionally disabled in production:
mark AI runtime as NOT APPLICABLE for release and preserve DisabledAiProvider.

Do not artificially enable AI only to improve audit percentage.

Close R-008 only when actual production scope is decided and evidenced.
```

---

# 10 — Final Closure Audit فقط بعد كل اللي فوق

```text
TASK ID:
QC-100-CLOSURE-10

TITLE:
Independent Final 100-Domain Closure Re-Audit

MODE:
FINAL VERIFICATION ONLY

MISSION:

Independently re-audit the current repository after CLOSURE-01 through
CLOSURE-09.

Do NOT trust their PASS claims.

FIRST:

Freeze:

current HEAD
branch
working tree
Node
pnpm
migration head
CI run
build identity
deployed identity if available.

READ:

all audit/100-percent files
all current closure evidence
current risk register
current source.

REVERIFY ORIGINAL RISKS:

R-001 PostgreSQL runtime
R-002 Browser/E2E
R-003 architecture boundary
R-004 CI
R-005 UAT
R-006 DR
R-007 scientific/policy
R-008 AI provider/scope
R-009 Node parity
R-010 historical score issue

For each risk output:

OPEN
CLOSED
ACCEPTED RISK
NOT APPLICABLE

with evidence.

RERUN REQUIRED GATES:

format
lint
typecheck
architecture
unit
integration
migrations
concurrency
security
build
E2E
accessibility
release identity
release verification

and any new closure commands.

VERIFY:

PostgreSQL evidence
Browser evidence
CI evidence
UAT evidence
DR evidence
deployment evidence
security evidence
policy evidence.

RE-AUDIT ALL 100 DOMAINS.

For each domain:

ID
domain
score
status
implementation evidence
test evidence
runtime evidence
security evidence
documentation evidence
open blocker.

100 requires ALL applicable evidence dimensions.

Do not carry forward old scores.

Calculate from current evidence only.

CREATE:

audit/100-percent/CLOSURE-FINAL-100-DOMAIN-AUDIT.md
audit/100-percent/CLOSURE-FINAL-EVIDENCE-INDEX.md
audit/100-percent/CLOSURE-FINAL-RISK-REGISTER.md
audit/100-percent/CLOSURE-FINAL-PRODUCTION-DECISION.md

FINAL VERDICT MUST BE EXACTLY ONE:

EVIDENCE-BACKED 100/100 CLOSURE

or

NOT YET 100/100

If not 100:

give the exact remaining domains
exact remaining risk IDs
exact evidence missing
and generate only the minimum next remediation prompts.

No rounding.
No fake PASS.
No optimism-based closure.
```

## ترتيبك الآن

```text
01 CI + Node
   ↓
02 Architecture Boundary
   ↓
03 PostgreSQL Runtime
   ↓
04 E2E + A11y + Lottie
   ↓
05 Render Runtime
   ↓
06 UAT / UX Research
   ↓
07 DR / Restore
   ↓
08 Scientific / Policy
   ↓
09 AI Provider
   ↓
10 Final 100-Domain Audit
```
