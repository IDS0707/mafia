/**
 * i18n — reactive translation store with type-safe keys.
 *
 * Usage in Svelte:
 *   import { t, lang, setLang } from '$lib/i18n';
 *   <h1>{$t('hero.welcome')}</h1>
 *   <button on:click={() => setLang('ru')}>RU</button>
 *
 * t() supports {var} interpolation:
 *   t('lobby.needMore', { n: 3 })
 */

import { derived, writable, get } from 'svelte/store';
import { readString, writeString } from '$lib/utils/storage';
import { en, type TKey } from './locales/en';
import { ru } from './locales/ru';
import { uz } from './locales/uz';
import type { Lang } from '$types/index';

const STORAGE = 'lang';

const DICTS: Record<Lang, Record<TKey, string>> = { en, ru, uz };

function detectInitial(): Lang {
  const saved = readString(STORAGE, '');
  if (saved === 'en' || saved === 'ru' || saved === 'uz') return saved;
  const nav = (navigator.language || 'en').toLowerCase();
  if (nav.startsWith('uz')) return 'uz';
  if (nav.startsWith('ru')) return 'ru';
  return 'en';
}

export const lang = writable<Lang>(detectInitial());

lang.subscribe((l) => {
  writeString(STORAGE, l);
  document.documentElement.lang = l;
});

/** Reactive translator. Use as $t in templates. */
export const t = derived(lang, ($lang) => {
  const dict = DICTS[$lang];
  const fallback = DICTS.en;
  return (key: TKey, vars?: Record<string, string | number>): string => {
    const raw = dict[key] ?? fallback[key] ?? key;
    if (!vars) return raw;
    return raw.replace(/\{(\w+)\}/g, (_, k) =>
      vars[k] !== undefined ? String(vars[k]) : `{${k}}`,
    );
  };
});

/** Imperative helper for non-component code (game engine, etc.). */
export function translate(
  key: TKey,
  vars?: Record<string, string | number>,
): string {
  return get(t)(key, vars);
}

export function setLang(l: Lang): void {
  lang.set(l);
}

export type { TKey } from './locales/en';
