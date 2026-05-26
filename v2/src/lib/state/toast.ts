/**
 * Toast notifications — transient bottom messages.
 */

import { writable } from 'svelte/store';

interface ToastState {
  msg: string;
  visible: boolean;
}

export const toast = writable<ToastState>({ msg: '', visible: false });

let timer: number | null = null;

export function showToast(msg: string, ms = 2200): void {
  toast.set({ msg, visible: true });
  if (timer !== null) clearTimeout(timer);
  timer = window.setTimeout(() => {
    toast.update((t) => ({ ...t, visible: false }));
  }, ms);
}
