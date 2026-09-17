import { isPageVisibility, type CanonicalRoute } from './route-types.js';

export interface RouteIntegrityInput {
  readonly routes: readonly CanonicalRoute[];
  readonly pageFiles: readonly string[];
  readonly navigationRouteIds: readonly string[];
}
/** Pure integrity check shared by unit tests and the filesystem architecture gate. */
export function validateRouteIntegrity(input: RouteIntegrityInput): readonly string[] {
  const errors: string[] = [],
    ids = new Set<string>(),
    paths = new Set<string>(),
    registeredPages = new Set<string>();
  for (const route of input.routes) {
    if (ids.has(route.id)) errors.push(`duplicate route id: ${route.id}`);
    ids.add(route.id);
    if (paths.has(route.path)) errors.push(`duplicate canonical path: ${route.path}`);
    paths.add(route.path);
    if (!isPageVisibility(route.visibility)) errors.push(`unknown visibility: ${route.id}`);
    if (!route.domain || !route.title || !route.breadcrumb?.label)
      errors.push(`incomplete page metadata: ${route.id}`);
    if (route.file !== route.page) errors.push(`inconsistent page file metadata: ${route.id}`);
    if (route.fileExpectation === 'required' && !input.pageFiles.includes(route.page))
      errors.push(`registered route has missing page file: ${route.page}`);
    registeredPages.add(route.page);
  }
  for (const page of input.pageFiles)
    if (!registeredPages.has(page)) errors.push(`application page is not registered: ${page}`);
  for (const routeId of input.navigationRouteIds)
    if (!ids.has(routeId)) errors.push(`navigation points to unknown route: ${routeId}`);
  return errors;
}
