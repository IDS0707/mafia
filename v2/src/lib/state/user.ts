/**
 * User store — authenticated player profile.
 * Persists to localStorage. Holds wallet, level, XP, stats.
 */

import { writable, get, type Writable } from 'svelte/store';
import { readJSON, writeJSON, remove } from '$lib/utils/storage';
import { pick } from '$lib/utils/random';
import type { User, AvatarKey } from '$types/index';

const STORAGE = 'user:v2';

const AVATARS: AvatarKey[] = [
  'a-don', 'a-joker', 'a-azik', 'a-samurai', 'a-cherry',
  'a-queen', 'a-umid', 'a-shadow', 'a-black', 'a-mrn',
];

export const user: Writable<User | null> = writable<User | null>(
  readJSON<User | null>(STORAGE, null),
);

user.subscribe((u) => {
  if (u) writeJSON(STORAGE, u);
});

export function createUser(input: { name?: string; email: string }): User {
  const u: User = {
    name: input.name?.trim() || input.email.split('@')[0] || 'Player',
    email: input.email,
    gold: 12450,
    gems: 890,
    level: 1,
    xp: 0,
    xpNeeded: 1000,
    games: 0,
    wins: 0,
    avatar: pick(AVATARS),
  };
  user.set(u);
  return u;
}

export function logout(): void {
  user.set(null);
  remove(STORAGE);
}

export function addReward(xp: number, coins: number, won: boolean): void {
  const u = get(user);
  if (!u) return;
  const next: User = { ...u };
  next.games += 1;
  if (won) next.wins += 1;
  next.xp += xp;
  next.gold += coins;
  while (next.xp >= next.xpNeeded) {
    next.xp -= next.xpNeeded;
    next.level += 1;
    next.xpNeeded = Math.round(next.xpNeeded * 1.25);
  }
  user.set(next);
}
