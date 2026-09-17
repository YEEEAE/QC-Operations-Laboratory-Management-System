# Astro pages

`src/pages` is the Delivery layer. A page may parse request input, obtain authenticated context, invoke an authorized query or use case, and render UI.

Pages must not contain raw SQL, direct repository access, business rules, permission definitions, or state transitions. The canonical planned page tree is encoded in `src/shared/routing/routes.ts`; create pages with their owning domain implementation, not as placeholders.

For every new application page, add a `definePageRoute` declaration first. It requires the stable route ID, canonical path, Astro page file, owning domain, and title; its visibility defaults to `AUTHENTICATED`. Use `PUBLIC` or `YAZEED_ONLY` only as an explicit exception. Add navigation only as presentation metadata and enforce every mutation in its server-side use case. `pnpm test:architecture` rejects unregistered pages, missing files, duplicate IDs/paths, invalid visibility, missing metadata, and navigation references that do not resolve.
