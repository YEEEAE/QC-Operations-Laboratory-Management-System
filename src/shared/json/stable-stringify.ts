// JSON.stringify alone throws on bigint, which controlled record versions and
// other identifiers carry; durable JSONB payloads and hashes must not.
export function stableJson(value: unknown): string {
  return JSON.stringify(value, (_key, item: unknown) =>
    typeof item === 'bigint' ? item.toString() : item,
  );
}
