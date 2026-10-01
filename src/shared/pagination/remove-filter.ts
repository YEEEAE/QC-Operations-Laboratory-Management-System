/** Removing one filter changes the result set, so its old page is never retained. */
export function removeFilter(searchParams: URLSearchParams, filterName: string): URLSearchParams {
  const next = new URLSearchParams(searchParams);
  next.delete(filterName);
  next.delete('page');
  return next;
}
