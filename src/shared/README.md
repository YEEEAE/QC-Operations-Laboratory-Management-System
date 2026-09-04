# Shared capabilities

`src/shared` contains cross-cutting technical capabilities such as authorization, audit, validation, routing, errors, and time. It must not become a home for domain business rules.

Routing is metadata only. It does not grant a permission or replace server-side authorization.
