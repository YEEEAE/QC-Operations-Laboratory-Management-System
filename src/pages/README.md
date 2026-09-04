# Astro pages

`src/pages` is the Delivery layer. A page may parse request input, obtain authenticated context, invoke an authorized query or use case, and render UI.

Pages must not contain raw SQL, direct repository access, business rules, permission definitions, or state transitions. The canonical planned page tree is encoded in `src/shared/routing/routes.ts`; create pages with their owning domain implementation, not as placeholders.
