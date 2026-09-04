const DEFAULT_RETURN_TO = '/dashboard';
export function safeReturnTo(value: unknown, fallback = DEFAULT_RETURN_TO): string {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//'))
    return fallback;
  try {
    const parsed = new URL(value, 'https://internal.invalid');
    return parsed.origin === 'https://internal.invalid' ? value : fallback;
  } catch {
    return fallback;
  }
}
