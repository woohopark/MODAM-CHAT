/** Same-origin cookie transport. Auth tokens never enter application state. */
export async function api(path: string, init: RequestInit = {}): Promise<unknown> {
  const response = await fetch('/api/' + path, {
    ...init,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', 'X-Modam-Request': '1', ...init.headers },
  });
  if (!response.ok) throw new Error(`API_${response.status}`);
  return response.status === 204 ? undefined : response.json();
}
export function record(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    throw new Error('Invalid API response');
  return value as Record<string, unknown>;
}
export function string(value: unknown): string {
  if (typeof value !== 'string') throw new Error('Invalid API string');
  return value;
}
