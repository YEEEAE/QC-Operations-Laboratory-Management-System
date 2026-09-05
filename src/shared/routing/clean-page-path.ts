/**
 * Converts an Astro source-like page URL into its public route equivalent.
 *
 * Examples:
 *   /dashboard/index.astro -> /dashboard
 *   /login.astro           -> /login
 *   /                    -> undefined
 */
export function cleanAstroPagePath(pathname: string): string | undefined {
  if (!pathname.endsWith('.astro')) return undefined;

  const withoutExtension = pathname.slice(0, -'.astro'.length) || '/';
  if (withoutExtension === '/index') return '/';

  const withoutIndex = withoutExtension.replace(/\/index$/, '');
  return withoutIndex || '/';
}
