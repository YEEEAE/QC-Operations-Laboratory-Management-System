import { describe, expect, it } from 'vitest';
import { isUuid } from '../../../src/shared/id/uuid.js';
describe('Tasks repository contracts', () => { it('accepts only UUID technical identifiers at the boundary', () => { expect(isUuid('not-a-uuid')).toBe(false); expect(isUuid('01900000-0000-7000-8000-000000000001')).toBe(true); }); });
