import { AppError } from '../errors/app-error.js';
import { createRequestLogger } from './logger.js';
import { currentCorrelation, recordCounter, withSpan } from './telemetry.js';

type DependencyName = 'postgres' | 'storage' | 'ai-provider' | 'outbox';

/** Emit searchable, bounded telemetry for an infrastructure failure. */
export async function reportDependencyFailure(input: {
  dependency: DependencyName;
  operation: string;
  error: unknown;
}): Promise<void> {
  const failure =
    input.error instanceof AppError
      ? input.error
      : new AppError('SYSTEM_DATABASE_UNAVAILABLE', {
          cause: input.error,
          userSafe: false,
          retryability: 'AFTER_DELAY',
        });
  const emit = async () => {
    const logger = createRequestLogger(currentCorrelation());
    recordCounter('qc_dependency_failures_total', 1, {
      dependency: input.dependency,
      operation: input.operation,
      error_family: failure.code,
      outcome: 'error',
    });
    logger.error(
      {
        event: 'dependency.failure',
        dependency: input.dependency,
        operation: input.operation,
        error_family: failure.code,
        outcome: 'error',
      },
      'Dependency operation failed',
    );
  };

  try {
    await withSpan(`${input.dependency}.${input.operation}.failure`, async () => emit(), {
      dependency: input.dependency,
      operation: input.operation,
      outcome: 'error',
    });
  } catch {
    // Observability must not turn an infrastructure failure into an unhandled rejection.
  }
}
