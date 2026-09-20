import { stableSeedUuid } from '../../db/seeds/common.js';

/** Stable identifiers isolated by the explicit suite and test case names. */
export function createFixtureScope(suite: string, testCase: string) {
  const normalizedSuite = suite.trim();
  const normalizedTestCase = testCase.trim();
  if (!normalizedSuite || !normalizedTestCase)
    throw new Error('Fixture suite and test case names are required.');
  const namespace = JSON.stringify([normalizedSuite, normalizedTestCase]);

  return {
    id: (label: string) => stableSeedUuid(`${namespace}:${label}`),
    key: (label: string) => `${namespace}:${label}`,
  };
}
