import { z } from 'zod';

const optionalReference = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

// Scoped owner decision CA-F-01, not scientific PD-16 authority.
// Server-derived fields (id, actor, timestamps, state, version, owner) are
// intentionally absent and rejected by `.strict()`.
export const createNcrInput = z
  .object({
    intentId: z.string().uuid(),
    findingId: z.string().uuid(),
    ncrNo: z.string().trim().min(1),
    title: z.string().trim().min(1),
    description: z.string().trim().min(1),
    affectedItemCode: optionalReference,
    affectedLot: optionalReference,
  })
  .strict();
export type CreateNcrInput = z.infer<typeof createNcrInput>;
