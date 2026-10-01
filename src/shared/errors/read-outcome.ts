import { classifyReadFailure } from './read-failure.js';

export type ReadOutcome<T> =
  { status: 'AVAILABLE'; value: T } | { status: 'NOT_VISIBLE' } | { status: 'UNAVAILABLE' };

/** Keeps one source's read state independent from sibling reads. */
export async function readOutcome<T>(read: () => Promise<T>): Promise<ReadOutcome<T>> {
  try {
    return { status: 'AVAILABLE', value: await read() };
  } catch (error) {
    const failure = classifyReadFailure(error);
    return failure === 'UNAVAILABLE' ? { status: 'UNAVAILABLE' } : { status: 'NOT_VISIBLE' };
  }
}
