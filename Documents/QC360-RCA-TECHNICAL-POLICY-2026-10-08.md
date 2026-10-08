# RCA technical source — separate analysis workflow

Date: 2026-10-08. Version: 1. Scope: REQ-QUAL-005. Status: user-authorized technical source authorship; controlled QMS acceptance and electronic approval NOT ESTABLISHED.

The user authorized local residual implementation and source creation. This source defines the technical draft/edit/submit contract only. It does not establish QMS review authority, signatures, separation of duties, scientific acceptance, source effectivity, NCR closure or CAPA effectiveness.

RCA is a separate entity linked to an NCR. Create requires authorized scoped NCR VIEW and RCA CREATE, the exact opened NCR version and an NCR that is not CLOSED or VOID. The owning NCR application read facade rechecks the source in the RCA creation transaction with a share lock. The NCR is never mutated. A draft has version 1 and no approval evidence.

The existing RCA state model permits START from DRAFT/RETURNED and SUBMIT from IN_PROGRESS with recorded nonblank analysis and root cause. Editing is limited to DRAFT, IN_PROGRESS or RETURNED. Every write requires the submitted expectedVersion, server authorization, an owner-scoped row lock and state recheck. Mutation and audit insert share one transaction; audit failure rolls back the RCA mutation. Audit records the linked NCR, prior/current version and technical source identity. The analysis text stays in its owning RCA record and is not duplicated into audit.

Native POST create/edit/start/submit forms are reachable on the existing RCA register/detail routes. Failed edits retain submitted content and the opened version; successful mutations redirect with 303. SUBMITTED means pending controlled review, not approval. APPROVE, RETURN and VOID stay denied at use-case and repository boundaries pending approved QMS policy and electronic signature ceremony. No source document here substitutes for that ceremony or enables closure in another module.

Verification: focused source/use-case tests establish bounded technical behavior using synthetic records. Actual PostgreSQL concurrency/rollback, authenticated browser, accessibility and human UAT require separate evidence.
