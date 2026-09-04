export interface TestDatabaseContainer {
  getConnectionUri(): string;
}

export function assertTestEnvironment(): void {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Disposable database containers may only run in the test environment.');
  }
}

export function getTestDatabaseUrl(container: TestDatabaseContainer): string {
  assertTestEnvironment();

  return container.getConnectionUri();
}
