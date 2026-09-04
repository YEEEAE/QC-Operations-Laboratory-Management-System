export interface Clock {
  now(): Date;
}

export const systemClock: Clock = Object.freeze({ now: () => new Date() });

export function utcNow(clock: Clock = systemClock): Date {
  return new Date(clock.now().toISOString());
}
