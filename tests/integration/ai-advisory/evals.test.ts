import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { GetAdvisoryUseCase } from '../../../src/modules/ai-advisory/application/get-advisory.js';
import type {
  AiAdvisoryRequest,
  AiProvider,
} from '../../../src/modules/ai-advisory/ports/ai-provider.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';
import { AppError } from '../../../src/shared/errors/app-error.js';

interface EvalCase {
  id: string;
  kind: string;
  question: string;
  output?: unknown;
  context?: readonly { label: string; content: string }[];
  provider?: 'unavailable' | 'timeout';
  expected: 'AVAILABLE' | 'DENIED' | 'REFUSED' | 'UNAVAILABLE';
}

const dataset = JSON.parse(
  readFileSync('audit/100-percent/ai-evals/deterministic-eval-dataset.json', 'utf8'),
) as { confidentialData: boolean; cases: EvalCase[] };

const actor = (permissions: readonly string[]): ActorContext => ({
  id: '01900000-0000-7000-8000-0000000000e1',
  accountState: 'ACTIVE',
  roles: ['SUPERVISOR'],
  permissions: permissions.map((code) => ({
    code: code as ActorContext['permissions'][number]['code'],
    scopes: ['GLOBAL'],
  })),
});

const allAiPermissions = ['PERM-AI-USE', 'PERM-AI-SUMMARIZE', 'PERM-AI-SUGGEST', 'PERM-AI-DRAFT'];

function providerFor(testCase: EvalCase, calls: AiAdvisoryRequest[]): AiProvider {
  return {
    availability: async () =>
      testCase.provider
        ? { available: false, reason: 'UNAVAILABLE' as const }
        : { available: true },
    complete: async (request) => {
      calls.push(request);
      if (testCase.provider === 'timeout') throw new Error('provider timeout');
      return testCase.output;
    },
  };
}

describe('AI governance eval suite — deterministic, non-confidential dataset', () => {
  it('declares a non-confidential dataset and covers every requested governance case', () => {
    expect(dataset.confidentialData).toBe(false);
    expect(new Set(dataset.cases.map(({ kind }) => kind))).toEqual(
      new Set([
        'safe-advisory',
        'authority-output',
        'unauthorized',
        'secret-input',
        'malformed-output',
        'provider-unavailable',
      ]),
    );
    expect(dataset.cases).toHaveLength(14);
  });

  it.each(dataset.cases)('enforces expected disposition: $id', async (testCase) => {
    const calls: AiAdvisoryRequest[] = [];
    const useCase = new GetAdvisoryUseCase(providerFor(testCase, calls));
    const hasAuthorization = testCase.expected !== 'DENIED';
    const context = testCase.context ?? [];
    let actual: EvalCase['expected'];
    try {
      const result = await useCase.execute({
        actor: actor(hasAuthorization ? allAiPermissions : []),
        mode: 'SUMMARIZE',
        question: testCase.question,
        context,
        requestId: `eval-${testCase.id}`,
      });
      actual = result.status;
    } catch (error) {
      if (!(error instanceof AppError)) throw error;
      actual = 'DENIED';
    }
    expect(actual).toBe(testCase.expected);
    if (testCase.expected === 'DENIED' || testCase.kind === 'secret-input')
      expect(calls).toHaveLength(0);
  });
});
