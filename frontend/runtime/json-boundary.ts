/** Millennium's FFI may decode JSON-valued Lua strings before returning them. */
export function jsonText(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object') return JSON.stringify(value);
  throw new Error('Unexpected backend JSON response type; refusing to treat it as missing data.');
}
