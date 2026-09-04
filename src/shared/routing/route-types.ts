export type RouteAccess = 'public' | 'authenticated' | 'permission-bound';

export type RouteFileExpectation = 'required' | 'deferred' | 'conditional';

export interface CanonicalRoute {
  readonly id: string;
  readonly path: string;
  readonly file: `src/pages/${string}`;
  readonly access: RouteAccess;
  readonly fileExpectation: RouteFileExpectation;
}
