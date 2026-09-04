import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../../config/constants';
import { AppError } from '../errors/app-error';

export interface PageInput {
  page?: unknown;
  pageSize?: unknown;
}
export interface Page {
  page: number;
  pageSize: number;
  offset: number;
}

function parseInteger(value: unknown, fallback: number): number {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value !== 'string' && typeof value !== 'number')
    throw new AppError('VALIDATION_INVALID_QUERY');
  if (!/^-?[0-9]+$/.test(String(value))) throw new AppError('VALIDATION_INVALID_QUERY');
  return Number(value);
}

export function parsePageInput(input: PageInput = {}): Page {
  const rawPage = parseInteger(input.page, DEFAULT_PAGE);
  const rawSize = parseInteger(input.pageSize, DEFAULT_PAGE_SIZE);
  return {
    page: Math.max(DEFAULT_PAGE, rawPage),
    pageSize: Math.min(MAX_PAGE_SIZE, Math.max(1, rawSize)),
    offset: (Math.max(DEFAULT_PAGE, rawPage) - 1) * Math.min(MAX_PAGE_SIZE, Math.max(1, rawSize)),
  };
}
