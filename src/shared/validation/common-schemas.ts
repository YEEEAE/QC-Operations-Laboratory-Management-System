import { z } from 'zod';
export const commonSchemas = {
  uuid: z.uuid(),
  dateOnly: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  searchQuery: z.object({ q: z.string().trim().min(1).max(200) }).strict(),
  pagination: z
    .object({
      page: z.coerce.number().int().min(1).optional(),
      pageSize: z.coerce.number().int().min(1).max(100).optional(),
    })
    .strict(),
};
