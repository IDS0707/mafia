/**
 * Minimal view router — single-store, hash-synced.
 * No external router dependency. Game has linear/forced flow, so
 * URL is read-only (bookmarkable views).
 */

import { writable, get } from 'svelte/store';
import type { ViewName } from '$types/index';

const initial: ViewName = 'splash';

export const view = writable<ViewName>(initial);

view.subscribe((v) => {
  if (typeof location !== 'undefined' && v !== 'splash' && v !== 'auth') {
    if (location.hash !== '#/' + v) {
      history.replaceState(null, '', '#/' + v);
    }
  }
});

export function go(name: ViewName): void {
  view.set(name);
  window.scrollTo(0, 0);
}

export function current(): ViewName {
  return get(view);
}
