export type RoleRegisterStatus = '' | 'active' | 'inactive';

export interface RoleRegisterRecord {
  name: string;
  code: string;
  description: string | null;
  active: boolean;
}

export const ROLE_REGISTER_PAGE_SIZE = 25;

export function parseRoleRegisterStatus(value: string): RoleRegisterStatus {
  return value === 'active' || value === 'inactive' ? value : '';
}

export function filterRoleRecords<T extends RoleRegisterRecord>(
  records: readonly T[],
  query: string,
  status: RoleRegisterStatus,
): T[] {
  const normalizedQuery = query.trim().toLocaleLowerCase('en');
  return records.filter((record) => {
    const matchesQuery =
      !normalizedQuery ||
      [record.name, record.code, record.description ?? ''].some((value) =>
        value.toLocaleLowerCase('en').includes(normalizedQuery),
      );
    const matchesStatus = !status || record.active === (status === 'active');
    return matchesQuery && matchesStatus;
  });
}

export function paginateRoleRecords<T>(records: readonly T[], requestedPage: number) {
  const pageCount = Math.max(1, Math.ceil(records.length / ROLE_REGISTER_PAGE_SIZE));
  const safePage = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const currentPage = Math.min(safePage, pageCount);
  const start = (currentPage - 1) * ROLE_REGISTER_PAGE_SIZE;
  return {
    currentPage,
    pageCount,
    items: records.slice(start, start + ROLE_REGISTER_PAGE_SIZE),
  };
}

export function buildRoleRegisterHref(input: {
  query?: string;
  status?: string;
  page?: number;
}): string {
  const params = new URLSearchParams();
  const query = input.query?.trim() ?? '';
  if (query) params.set('q', query);
  const status = parseRoleRegisterStatus(input.status ?? '');
  if (status) params.set('status', status);
  if (input.page && Number.isSafeInteger(input.page) && input.page > 1)
    params.set('page', String(input.page));
  const queryString = params.toString();
  return `/admin/roles${queryString ? `?${queryString}` : ''}`;
}
