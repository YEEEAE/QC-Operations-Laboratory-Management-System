# Coverage And Escalation

Use this reference when the default BrightAI audit scripts are not enough on their own.

## Covered Well By Existing Scripts

- HTML files with `href`, `src`, `action`, `poster`, `data-href`, and `data-src`
- CSS `url()` references
- JavaScript object keys such as `url`, `href`, `path`, and `link`
- JavaScript assignments and `setAttribute()` calls that set local URLs
- Public route normalization and redirect-aware checks handled by the existing audit scripts

## Require Manual Validation

- TypeScript and TSX import graphs
- JSX component props such as `to`, `href`, `as`, or custom navigation props
- Markdown and MDX links, images, and anchors
- Path aliases defined in config files
- `package.json` fields such as `main`, `module`, `types`, `exports`, `files`, and `bin`
- Router-specific references in React Router, Next.js, Astro, Nuxt, Vue Router, and SvelteKit
- Anchor targets inside Markdown, HTML, and long documentation pages

## Escalate To Manual Review When

- More than one plausible target file exists
- A fix would change routing behavior rather than just file reachability
- An alias may be stale but the owning config is ambiguous
- A circular dependency is detected
- The replacement would require guessing a deleted or renamed page
- The change crosses workspace or package boundaries in the monorepo

## Manual Review Checklist

- Confirm the source file still intends to point to the same target
- Confirm the target exists and is the correct semantic destination
- Confirm the path style matches nearby code
- Confirm the fix does not introduce duplicate imports or conflicting paths
- Re-run `npm run internal-links:audit` after applying the fix
