00A. Every ACTIVE authenticated member can see and open every ordinary operational page and read every ordinary operational record globally; secrets and identity-security data remain protected, and actions remain fully authorized.

00B. System Health is exclusive to the sole `SYSTEM_OWNER` bound to `yazeed`. Member/Role/Permission/Scope Administration is available to `Admin` and that `SYSTEM_OWNER`; every sensitive action still requires explicit permission, scope, SoD, state, and version checks.

00C. Page visibility never grants create, edit, review, approve, release, sign, void, restore, or administrative mutation authority.

01. UI visibility is never authorization.

02. Authorization is always enforced server-side.

03. No user may review/approve a controlled record when prohibited
    by the approved separation-of-duties policy.

04. Approved controlled records cannot be silently edited.

05. VOID does not destroy history.

06. SUPERSEDED does not destroy history.

07. Every important mutation must have:
    Actor
    Timestamp
    Entity
    Action
    Reason where required
    Audit reference

08. Scientific acceptance limits must originate from approved
    controlled sources.

09. AI cannot approve, reject, release, PASS or FAIL records.

10. Historical database migrations are immutable.

11. Reports obey the same authorization scope as the application.

12. Backups are not considered proven until restore is verified.

13. Master-data changes cannot retroactively rewrite historical records.

14. Draft, Submitted and Approved records have different integrity rules.

15. Admin privileges do not grant the right to rewrite historical facts.

16. Critical operations must be transactional.

17. Critical actions must be idempotent where applicable.

18. Concurrent edits must never silently overwrite one another.

19. All routes, tests and controlled workflows must be machine-verifiable.

20. No release-readiness claim is valid without evidence.
