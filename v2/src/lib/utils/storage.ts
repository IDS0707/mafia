/**
 * Type-safe localStorage wrapper with namespacing.
 * Never throws on parse errors — returns fallback instead.
 */

const NS = 'mafia:';

export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(NS + key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJSON<T>(key: string, value: T): void {
  try {
    localStorage.setItem(NS + key, JSON.stringify(value));
  } catch {
    /* quota exceeded — silent */
  }
}

export function remove(key: string): void {
  localStorage.removeItem(NS + key);
}

export function readString(key: string, fallback: string): string {
  const v = localStorage.getItem(NS + key);
  return v === null ? fallback : v;
}

export function writeString(key: string, value: string): void {
  try {
    localStorage.setItem(NS + key, value);
  } catch {
    /* silent */
  }
}
