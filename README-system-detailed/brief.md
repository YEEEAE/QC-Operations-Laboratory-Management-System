# QC Universe — Product & Experience Design Brief

> **Document:** `brief.md`  
> **Version:** 1.0  
> **Date:** 2026-10-16  
> **Status:** Interview complete — **31/31 decisions approved**  
> **Source:** Direct design interview with the project owner (Questions 1–31)  
> **Repository:** [YEEEAE/QC-Operations-Laboratory-Management-System](https://github.com/YEEEAE/QC-Operations-Laboratory-Management-System)  
> **Scope:** Requirements and design brief only. **No GitHub modifications authorized.**

> **Source reconciliation, 2026-10-30:** This brief records Q01–Q31 individually. The [implementation playbook](../audit/QC_Universe_Company_Implementation_Prompts_ONE_CLICK_COPY_NEON_2026-10-28.html) states that Q32–Q38 were approved in the owner discussion and summarizes the overall direction, but does not identify their individual wording. Do not assign details to those seven decisions without their original record. The same playbook records SYS-01–SYS-08 below. SYS-09–SYS-14 are **not approved**. The 2026 owner approval is scoped internal approval, not a formal electronic signature; e-signatures remain deferred. In-Process is separate from Incoming and Final Inspection unless the applicable controlled WI requires otherwise.

### System decisions recorded in the implementation playbook

- **SYS-01 B:** Suggest Finding-to-NCR escalation only under approved conditions.
- **SYS-02 A:** An inspection FAIL blocks release; disposition is controlled and manual, without automatic NCR creation.
- **SYS-03 D:** Simplified NCR closure is controlled and limited to formally eligible simple cases.
- **SYS-04 D:** Action completion, CAPA closure and effectiveness are separate; a documented exception is not proof of effectiveness.
- **SYS-05 D:** Retesting is evidence-based. SYS-05.1 C assigns authorization to the Laboratory Supervisor or System Owner; SYS-05.2 A permits one ordinary retest, with further attempts requiring a new investigation and approved exception; SYS-05.3 D requires evidence-based final disposition while preserving original results.
- **SYS-06 D:** Controlled effectivity supports immediate, scheduled or later activation, subject to established authority.
- **SYS-07 D:** Reconcile sources against evidence and block conflicts.
- **SYS-08 C:** Authorized staff set up manual controlled mappings; System Owner approval is required.

These decisions do not supply missing controlled criteria, source revisions, permissions or scientific acceptance limits. Implementation remains fail-closed where those are absent.

## 1. Executive Summary | الملخص التنفيذي

**QC Universe** is a premium, enterprise-grade redesign direction for the existing **QC Operations & Laboratory Management System**, accompanied by a **separately isolated, publicly accessible interactive demo**. The production system must remain a reliable QC/QMS operations platform; the public experience tells a memorable, interactive story suitable for an **Awwwards-level design aspiration**, without disclosing real QC data.

**Approved creative concept:** **“From Material to Decision — Every Quality Decision Has a Story.”**

**Core identity:** **Graphite Intelligence** — 40% formal/technical, 35% luxurious/futuristic, 25% scientific/laboratory. The product should feel like a sophisticated mission-control environment, with **Living Analytics**, **Layered 2.5D** visualizations, and **Precision Motion** rather than heavy 3D scenes.

**The narrative roles:**

- **The user is the commander:** actions, responsibilities, and priorities are presented clearly.
- **The product/material is the journey:** its status and evidence are traceable across actual applicable workflows.
- **The QC system is the central intelligence:** it connects departments, analysis, controlled documents, approvals, and audit evidence.

**Primary environments:**

1. **Production QC Universe:** real authorized operational data, role-based controls, and controlled business processes.
2. **Public Interactive Demo:** independently deployed, synthetic data only, simulated/read-only user journeys, and no production connection.

**Approved language:** **Professional English** for the application's UI and microcopy. This interview record retains **Arabic questions** for fidelity to the owner's original decisions.

---

## 2. Approved Interview — All Questions & Answers | الأسئلة والإجابات المعتمدة

> Each answer below was explicitly selected by the project owner. Design recommendations that were *not* selected are **not** treated as decisions.

### A. Project, narrative & interaction | الأسئلة 1–6

**Q01 — وش المشروع اللي نبنيه بالضبط؟**  
**Approved answer:** **QC Cinematic Experience** — a cinematic, interactive redesign **of the existing QC system**, not an unrelated website or a space-exploration project.  
**Implication:** Operational functionality is the foundation; visual storytelling enhances it.

**Q02 — وش القصة الأساسية اللي يعيشها المستخدم؟**  
**Approved answer:** **QC Universe / Integrated QC World (D)** — blend the material journey, command center, and employee workflow.  
**Implication:** Present the organization as one connected quality ecosystem.

**Q03 — وش أول مشهد يشوفه المستخدم عند الدخول؟**  
**Approved answer:** **Futuristic Command Center (B)**.  
**Implication:** Enter into an intelligence-focused dashboard, not an immersive 3D world or product film.

**Q04 — وش الإحساس والهوية البصرية اللي نبي نوصلها؟**  
**Approved answer:** **Custom mix (E): 40% Formal & Technical + 35% Luxury & Futuristic + 25% Scientific & Laboratory**.  
**Implication:** Visual credibility first, premium finish second, scientific precision throughout.

**Q05 — من هو البطل في القصة؟**  
**Approved answer:** **Combination (D)** — user = commander; product = journey; system = central intelligence.  
**Implication:** The experience is user-centered, connected to real material flows and system intelligence.

**Q06 — كيف يتفاعل المستخدم مع مركز القيادة؟**  
**Approved answer:** **Interactive Dashboard (B)**.  
**Implication:** Rich, usable analytics and card interactions; no forced cinematic camera navigation.

### B. Dashboard identity & layout | الأسئلة 7–13

**Q07 — وش عنصر الـHero الرئيسي في الـDashboard؟**  
**Approved answer:** **Living Analytics (B)**.  
**Implication:** Large, meaningful interactive data visualizations are the visual focal point.

**Q08 — وش نوع القصة اللي تعرضها البيانات؟**  
**Approved answer:** **Adaptive Living Analytics (D)**.  
**Implication:** Highlight authorized information, risks, and operational journeys according to the user's role.

**Q09 — وش الجو اللوني المعتمد؟**  
**Approved answer:** **Graphite Intelligence (D)**.  
**Implication:** Graphite/charcoal base, silver neutrals, restrained blue signals, premium industrial intelligence.

**Q10 — وش مستوى الحركة والمؤثرات؟**  
**Approved answer:** **Precision Motion (A)**.  
**Implication:** Micro-interactions and short, smooth transitions; prioritize productivity and responsiveness.

**Q11 — كيف تتوزع عناصر الـDashboard؟**  
**Approved answer:** **Modular Bento Grid (C)**.  
**Implication:** Cards of varied but intentional sizes arranged in a coherent, scannable grid.

**Q12 — كيف تتفاعل بطاقات الـBento Grid؟**  
**Approved answer:** **Intelligent Hybrid (D)**.  
**Implication:** Interact with charts in place; expand cards for detail; open full sections through clear navigation.

**Q13 — هل الـDashboard قابل للتخصيص لكل مستخدم؟**  
**Approved answer:** **Unified Dashboard (A)**.  
**Implication:** Same structural arrangement and card layout for everyone; content, visibility, and actions reflect authorization and role. **Do not introduce per-user drag-and-drop layout customization.**

### C. Department analytics, workflows & intelligence | الأسئلة 14–19

**Q14 — كيف تعرض تجربة كل قسم؟**  
**Approved answer:** **Department Intelligence (C)**.  
**Implication:** Department-specific analytics and risks first, followed by operational tools and records.

**Q15 — كيف ترتبط قصة السجل بين الأقسام؟**  
**Approved answer:** **Interactive Process Flow (B)**.  
**Implication:** An interactive, evidence-backed process map, reflecting only the stages applicable to that actual record.

**Q16 — كيف يتعامل النظام بصريًا مع المشاكل والمخاطر؟**  
**Approved answer:** **Intelligent Exception Experience (D)**.  
**Implication:** Present verified state, impact, supporting evidence, next action, and authorized responsibility in one understandable experience.

**Q17 — وش أسلوب الرسوم البيانية والعمق؟**  
**Approved answer:** **Layered 2.5D Intelligence (B)**.  
**Implication:** Subtle layered depth and elevation without inaccurate perspective-distorted data plots.

**Q18 — كيف تروي الرسوم قصة البيانات عبر الزمن؟**  
**Approved answer:** **Living Data Timeline (D)**.  
**Implication:** Current state, history, and comparative trends in interactive time-filtered views linked to genuine records.

**Q19 — كيف يندمج الذكاء الاصطناعي مع التحليلات؟**  
**Approved answer:** **Interactive AI Analyst (C)**.  
**Implication:** Conversational, source-aware advisory analysis only. Never grant AI approval, release, rejection, signing, or mutation authority.

### D. Operational workspaces | الأسئلة 20–25

**Q20 — كيف يكون شكل صفحات التشغيل والفحص والمختبر؟**  
**Approved answer:** **Enterprise Classic (A)**.  
**Implication:** Practical, structured tables and forms; no distracting cinematic UI inside the daily work process.

**Q21 — وش مستوى الجداول؟**  
**Approved answer:** **Intelligent Data Workspace (C)**.  
**Implication:** Filters, previews, context, quick authorized actions, and clear change history without unauthorized inline editing.

**Q22 — كيف تصمم نماذج إدخال البيانات؟**  
**Approved answer:** **Intelligent Enterprise Forms (D)**.  
**Implication:** Structured forms, contextual auto-fill from authorized sources, validation, controlled drafts, reduced repetitive input.

**Q23 — كيف تتم تجربة المراجعة والاعتماد؟**  
**Approved answer:** **Intelligent Approval Command Center (D)**.  
**Implication:** Unified view of authorized review queues, evidence, decisions, signatures, and audit trails while preserving approval sequence and separation of duties.

**Q24 — كيف يتم البحث والتنقل؟**  
**Approved answer:** **Enterprise Global Search (A)**.  
**Implication:** Straightforward centralized search by Lot, item, report, document, equipment, etc.; do not make Command Palette the primary UX.

**Q25 — كيف تظهر الأدلة وسجل التتبع؟**  
**Approved answer:** **Unified Traceability Intelligence (D)**.  
**Implication:** Timeline, document/evidence vault, and linked-record graph in one authorized exploration experience.

### E. Documentation, devices, notifications & performance | الأسئلة 26–30

**Q26 — كيف تتطور تجربة WI/SOP والمستندات؟**  
**Approved answer:** **Unified Document Intelligence (D)**.  
**Implication:** Document library + contextual relevant controlled documents + interactive representation of approved WI steps + revision history. The approved source document remains authoritative.

**Q27 — وش الأجهزة الأساسية المدعومة؟**  
**Approved answer:** **Desktop + Tablet (B)**.  
**Implication:** Full operational UX on desktop and tablet; simplified yet usable mobile fallback. The **public demo** should also be responsive and functional on mobile.

**Q28 — كيف تظهر الإشعارات الحية؟**  
**Approved answer:** **Intelligent Notification Command Center (D)**.  
**Implication:** Role-scoped notifications, tasks, risks, and priorities in one non-disruptive command center, with direct record links.

**Q29 — وش لغة الواجهة؟**  
**Approved answer:** **Professional English (A)**.  
**Implication:** Clear, concise, accurate QC/QMS terminology across every UI label, error, report, and instruction; default `en`/LTR.

**Q30 — كيف نوازن الأداء مع الإبهار؟**  
**Approved answer:** **Performance-First Premium (B)**.  
**Implication:** Premium visual finish with light 2.5D effects, progressive enhancement, lazy loading, and minimal operational latency.

### F. Deployment strategy | السؤال 31

**Q31 — كيف نحقق طموح Awwwards بدون كشف نظام QC الداخلي؟**  
**Approved answer:** **Full QC + Safe Interactive Demo (C)**.  
**Implication:** Improve the real authenticated QC system and create a **separate public interactive experience** with **entirely synthetic** data and isolated deployment. Public visitors cannot access actual operational records, credentials, or production APIs.

---

## 3. Non-Negotiable Product Requirements | ثوابت المشروع

### 3.1 Sidebar and navigation

**Preserve the existing Sidebar**: sections, page visibility, hierarchy, grouping, order, labels, authorized navigation, expand/collapse behavior, responsive behavior, and accessibility. Do not redesign or replace it. Avoid global CSS or token changes that alter it indirectly. All existing sections must remain reachable according to current permissions.

### 3.2 Real-world QC integrity

- Preserve the existing Astro SSR / Node adapter / PostgreSQL / modular-monolith architecture.
- Preserve server-side authorization, default-deny behavior, role and scope restrictions, separation of duties, and E-signature conditions.
- Never conflate scientific `PASS` with material `RELEASED`.
- Keep approved/signed/closed/void/superseded records protected by their actual controlled change processes.
- Never invent an applicable ISO requirement, business rule, process stage, inspection limit, signature, approval, or operational record.
- All analytics and actions must respect real permissions and record-level data scope.
- The existing audit trail stays intact and immutable.
- Never label cached snapshots as truly real-time without verified real-time updates.

### 3.3 AI safety and governance

The Interactive AI Analyst is advisory. It may summarize authorized trends, explain evidence, and propose investigation questions. It **must not** autonomously approve, reject, release, sign, or update QC records. Respect existing external-processing approval, permitted data classes, per-request consent, provider configuration, and source-verification gates. Do not leak confidential material through AI or design tools.

### 3.4 Production and public demo isolation

| Property | Production system | Public demo |
|---|---|---|
| Audience | Authenticated authorized QC users | Public visitors |
| Data | Real, permission-scoped QC data | **Entirely synthetic**, purpose-created fixtures |
| Interactions | Real controlled workflows | Read-only or local simulation |
| Credentials | Private protected secrets | None from production |
| Database / APIs | Existing authorized back end | **No connection** to production DB, sessions, storage, or APIs |
| Deployment | Existing protected application path | Separate deployment/environment |
| Records and decisions | Genuine audited decisions | Clearly marked fictional examples |

Do **not** copy production data and merely anonymize it for the demo.

---

## 4. Approved Visual & Interaction Specification

### 4.1 Visual identity

- **Mood:** formal technical reliability + restrained premium futurism + scientific clarity.
- **Palette direction:** graphite/charcoal, deep gray, silver, and subtle electric blue accents.
- **Status colors:** preserve a coherent semantic distinction between Pass / Fail / Hold / Approved / Released / Review.
- **Typography:** professional, legible sans-serif; tabular numerals for KPIs, tables, and timestamps.
- **Layout:** purposeful Modular Bento Grid for the dashboard; traditional enterprise structure inside operational pages.
- **Depth:** layer, surface, shadow, and subtle elevation; **not** heavy WebGL, camera travel, or exaggerated 3D chart perspective.

**Initial proposed palette (not a previously approved exact color contract):**

| Token purpose | Proposed seed |
|---|---|
| Canvas | `#14181E` |
| Surface | `#252B34` |
| Primary text | `#E8EDF5` |
| Signal blue | `#92B8F2` |
| Warning accent | `#D5A36F` |

Use accessible contrast and reconcile these with existing semantic design tokens rather than applying uncontrolled global overrides.

### 4.2 Motion

- **Precision Motion**, not cinematic overload.
- Suggested hover/press response: 120–180 ms.
- Suggested expansion/transition: 180–240 ms.
- Respect `prefers-reduced-motion`.
- No scroll hijacking, intrusive animation, decorative constant particle systems, or heavy startup sequences.
- Never make the user wait through a story to complete routine QC operations.

### 4.3 Dashboard

Use a **fixed common layout**, with role-aware **data and actions**, not role-specific draggable configurations. Major zones should include:

- Living Analytics hero and time comparisons.
- Quality / Quarantine / Receiving / Laboratory / Reject / Equipment KPIs where supported.
- Approvals, pending work, overdue actions, notifications, and exceptions.
- Process Flow, recent activities, risk highlights, and data freshness.
- Direct links to authorized detail pages and expandable/inspectable charts.

Every metric needs, where applicable: definition, numerator, denominator, time period, source, unit, timezone, actor scope, freshness, and drill-down. Differentiate unavailable, inaccessible, empty, stale, and zero states.

### 4.4 Operational pages

- **Department Intelligence:** page-specific analysis first, followed by core operational controls.
- **Enterprise Classic:** concise headings, practical tables and forms, minimal decorative content.
- **Data workspace:** advanced filters/sorting, readable columns, quick previews, accessible pagination.
- **Enterprise Forms:** verified prefill, clear validation, evidence, state-specific controls.
- **Approval Center:** legitimate approval routing, queue views, evidence and signatures.
- **Global Search:** straightforward search, grouped scoped results, clear destination links.
- **Notifications:** non-intrusive, prioritized, permission-aware alerts, with truthful freshness indicators.
- **Document Intelligence:** controlled revisions and effective copies, with contextual WI/SOP links.
- **Traceability:** timeline + relationships + evidence previews that reflect recorded links only.

### 4.5 Interactive Process Flow

A sample visual process may illustrate:

`Receiving → Quarantine → Applicable Inspection/Test → Review → Authorized Decision`

This is **not a mandatory one-size-fits-all QC rule**: actual branches may differ, including Lab, Hold, Reject, NCR, CAPA, and Release Governance. Render only stages that genuinely apply to a given record, with evidence-backed state and timestamp metadata.

---

## 5. Public Story Experience | تجربة العرض العامة

**Narrative title:** **From Material to Decision**

| Act | Chapter | Visitor experience |
|---|---|---|
| 01 | **Enter Mission Control** | Explore an impressive but understandable Living Analytics command center. |
| 02 | **Material Arrives** | Select an invented Lot and examine its Receiving details. |
| 03 | **Quality Under Control** | Follow applicable Inspection / Laboratory evidence and controlled instructions. |
| 04 | **An Exception Appears** | Discover a fictional FAIL, what it affects, and what evidence supports it. |
| 05 | **Controlled Decision** | See a simulated approval/review path and understand that test PASS is distinct from release. |
| 06 | **Complete Traceability** | Scrub the Living Data Timeline to review each fictional event, evidence item, and decision. |

**Signature interaction:** **The Quality Decision Journey** — a visitor goes from a visual data point to a Lot, follows its process flow, examines an exception, and navigates the evidence that informs the final decision. Allow chapter navigation and replay; never force users through the entire sequence.

**Awwwards is an aspiration, not an assured nomination or award.** Public storytelling and polished visual design must still satisfy usability, speed, mobile support, and accessibility.

---

## 6. Existing Repository Context (Read-Only Review)

A prior read-only GitHub review inspected the repository structure and source including:

- `README.md`
- `package.json`
- `src/pages/dashboard/index.astro`
- `src/ui/layouts/AppLayout.astro`
- `src/ui/shell/Sidebar.astro`
- `src/ui/styles/tokens.css`
- `src/ui/charts/Chart.astro`
- `src/ui/components/dashboard/DashboardCounts.astro`
- `src/ui/components/data/DataTable.astro`
- `src/pages/search.astro`
- `src/pages/notifications.astro`
- `src/pages/documents/index.astro`
- `src/pages/documents/[documentId]/index.astro`
- `src/pages/ai-advisory.astro`
- `src/shared/routing/routes.ts`
- `src/shared/search/search-service.ts`
- `src/shared/notifications/notification-service.ts`
- `tests/e2e/responsive.spec.ts`

**Observed source-level foundations (not a live deployment audit):**

1. Astro server-rendered UI with domain-separated modules and protected application routing.
2. Dashboard already renders authorized metrics, work queues, process stages, trend SVG, activity, and coverage/freshness metadata.
3. Navigation already has Sidebar/Topbar and separate Command Palette capability; chosen **Enterprise Global Search** remains the primary search UX.
4. Document register has browsing, revision/effective-version metadata, and document review pathways.
5. Existing search and notification services provide functionality to build on, not duplicate needlessly.
6. AI Advisory contains permission, policy, and external-data-processing gates that must be respected.
7. UI token palette currently contains dark greens; the approved Graphite direction requires careful scoped design integration.
8. The repository has responsive and accessibility-related Playwright tests.

**Verification limit:** Reading source is not equivalent to running the service, testing production readiness, or confirming current deployment behavior. An implementing agent must inspect the current checkout, exact commit, dependency versions, and active scripts before code changes.

---

## 7. Working Assumptions (Not Owner-Approved Design Answers)

The following are **proposed engineering defaults**, not additional interview approvals:

| Item | Default assumption | Validation needed |
|---|---|---|
| Public demo hosting | Separate origin and runtime | Hosting, CSP, deployment, domain ownership |
| Demo content | Synthetic, read-only narrative fixture data | Privacy and isolation tests |
| Typeface | Legible licensed sans-serif, e.g. Inter | Font licensing, weights, readability |
| Motion timings | 120–240ms typical UI transitions | Accessibility and perceived performance tests |
| Accessibility | Target WCAG 2.2 AA | Automated + manual verification |
| Demo performance | Lighthouse Performance ≥90 / Accessibility ≥95 | Reproducible measurements |
| Web performance | LCP ≤2.5s, INP ≤200ms, CLS ≤0.1 | Real or representative field/lab evidence |
| Breakpoints | Test 320, 375, 768, 1024, 1280, 1440px | Actual components and device testing |
| Public demo story | Six chapters with direct navigation | Usability tests and owner review |
| Stitch MCP | Use as design exploration tool; verify actual tool availability | OpenCode MCP configuration |

**Do not silently represent any target metric as a measured achieved result.**

---

## 8. Suggested Implementation Order | أولويات التنفيذ

1. **Repository baseline:** inspect current HEAD, working-tree changes, routes, components, business rules, and test status.
2. **Design exploration with Stitch MCP:** generate coherent Graphite Intelligence screen references; verify previews and choose visual execution direction without changing approved decisions.
3. **Scoped design-system implementation:** introduce appropriate reusable components/tokens while freezing Sidebar structure and behavior.
4. **Mission Control Dashboard:** implement Bento, Living Analytics, 2.5D layering, role-aware authorized drilldowns.
5. **Department and operational workspaces:** Quality, Receiving, Quarantine, Inspection, Laboratory, Reject, Equipment, and operational forms/tables.
6. **Controlled workflows:** Approvals, Controlled Documents, Traceability, Search, Notifications, and permitted AI advisory improvements.
7. **Separate public demo:** synthetic fixtures, six acts, safe visual interactions, isolated deployment architecture.
8. **Verification:** unit, integration, architecture, permissions, responsive, E2E, accessibility, security, and performance checks.

### Acceptance conditions

- Existing Sidebar structure, pages, labels, ordering, group visibility, and behavior remain unchanged.
- Production approval/release/SoD rules and authorized state transitions remain unchanged.
- No fabricated QC figures or false “live” data.
- No confidential records or production endpoints in the public demo.
- English enterprise copy is concise and professionally phrased.
- The enhanced system is navigable by mouse, keyboard, and tablet touch.
- Charts are numerically accurate and accessible.
- Critical workflows exhibit no new verified regressions.
- Release status remains evidence-based: `PASS`, `PARTIAL`, `BLOCKED`, or `FAIL`, with production and public-demo readiness separately assessed.

---

## 9. Instructions for an Implementing OpenCode Agent

> This document is the **authoritative interview design brief**, not an authorization to edit or deploy anything on its own.

- Use this brief as the source of truth for the owner's **31 approved decisions**.
- Compare the latest repository source with the repository observations above; source code determines actual implemented behavior.
- Detect and use installed Stitch MCP tools according to their current schemas rather than inventing tool names.
- Do not push, commit, merge, open PRs, or modify GitHub.
- Only make local implementation changes when the owner separately authorizes such execution.
- Do not overwrite unrelated local work or destructively reset the checkout.
- Treat business rules and security boundaries as immutable unless separately reviewed and approved.
- Preserve the existing Sidebar exactly, including indirect styling and accessibility behavior.
- Provide measurable, test-backed findings; distinguish assumptions and limitations.

## 10. Final Approved Product Definition

**QC Universe** is a **Graphite Intelligence**-styled, **Professional English**, **Performance-First Premium** QC Operations & Laboratory Management System featuring a **Futuristic Command Center**, **Living Analytics**, **Modular Bento Grid**, **Layered 2.5D**, **Precision Motion**, **Department Intelligence**, **Interactive Process Flows**, **Enterprise Classic** workspaces, **Intelligent Forms & Data Tables**, **Controlled Approvals**, **Unified Traceability & Document Intelligence**, **Global Search**, **Intelligent Notifications**, and an **Advisory Interactive AI Analyst**.

Its public-facing counterpart is a **securely isolated synthetic interactive demo**, telling the complete **material-to-decision** journey with high-quality responsive storytelling while respecting the confidentiality and operational integrity of the real QC system.

**Approved interview count: 31 decisions.**  
**GitHub modification status: None.**
