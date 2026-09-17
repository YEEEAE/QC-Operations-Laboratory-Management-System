import type { PermissionCode } from '../authorization/permissions.js';

/** Browser-page visibility is deliberately smaller than authorization. */
export type PageVisibility = 'PUBLIC' | 'AUTHENTICATED' | 'YAZEED_ONLY';
export type RouteFileExpectation = 'required' | 'deferred' | 'conditional';
export type NavigationGroupId =
  | 'overview'
  | 'work'
  | 'quality'
  | 'quarantine'
  | 'laboratory'
  | 'assets'
  | 'governance'
  | 'insights'
  | 'administration'
  | 'system';

export interface PageNavigation {
  readonly group: NavigationGroupId;
  readonly label: string;
  readonly order: number;
  /** Presentation-only gating; it never authorizes a request or mutation. */
  readonly visibilityCapabilities?: readonly PermissionCode[];
}
export interface BreadcrumbMetadata {
  readonly label: string;
  readonly parentRouteId?: string;
}
export interface CanonicalRoute {
  readonly id: string;
  readonly path: `/${string}`;
  readonly page: `src/pages/${string}`;
  readonly domain: string;
  readonly title: string;
  readonly navigation?: PageNavigation;
  readonly breadcrumb: BreadcrumbMetadata;
  readonly visibility: PageVisibility;
  /** Descriptive only. Server-side use cases remain the authority. */
  readonly mutationCapabilities: readonly PermissionCode[];
  readonly fileExpectation: RouteFileExpectation;
  /** Compatibility projection for legacy callers; do not add new policy here. */
  readonly access: 'public' | 'authenticated' | 'permission-bound';
  /** Compatibility alias while callers migrate from `file`. */
  readonly file: `src/pages/${string}`;
}
export interface PageRouteDeclaration {
  readonly id: string;
  readonly path: `/${string}`;
  readonly page: `src/pages/${string}`;
  readonly domain: string;
  readonly title: string;
  readonly navigation?: PageNavigation;
  readonly breadcrumb?: BreadcrumbMetadata;
  readonly visibility?: PageVisibility;
  readonly mutationCapabilities?: readonly PermissionCode[];
  readonly fileExpectation?: RouteFileExpectation;
}
const visibilityValues = new Set<PageVisibility>(['PUBLIC', 'AUTHENTICATED', 'YAZEED_ONLY']);
/** New application pages default to AUTHENTICATED unless explicitly public/owner-only. */
export function definePageRoute(declaration: PageRouteDeclaration): CanonicalRoute {
  const visibility = declaration.visibility ?? 'AUTHENTICATED';
  return {
    ...declaration,
    breadcrumb: declaration.breadcrumb ?? { label: declaration.title },
    visibility,
    mutationCapabilities: declaration.mutationCapabilities ?? [],
    fileExpectation: declaration.fileExpectation ?? 'required',
    access:
      visibility === 'PUBLIC'
        ? 'public'
        : declaration.mutationCapabilities?.length
          ? 'permission-bound'
          : 'authenticated',
    file: declaration.page,
  };
}
export function isPageVisibility(value: unknown): value is PageVisibility {
  return typeof value === 'string' && visibilityValues.has(value as PageVisibility);
}
