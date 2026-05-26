/**
 * Random helpers — game-deterministic surface for future seeding.
 */

export const randInt = (n: number): number => Math.floor(Math.random() * n);

export const pick = <T>(arr: readonly T[]): T => arr[randInt(arr.length)] as T;

export function shuffle<T>(arr: readonly T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    [a[i], a[j]] = [a[j] as T, a[i] as T];
  }
  return a;
}

export function uid(prefix = ''): string {
  return prefix + Math.random().toString(36).slice(2, 9);
}
