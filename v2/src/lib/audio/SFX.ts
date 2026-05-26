/**
 * SFX — fully-synthesized one-shot sound effects.
 * Routes through audio.buses.sfx with persistent volume / mute.
 * All sounds are CPU-cheap procedural oscillators — zero asset payload.
 */

import { audio } from './AudioEngine';
import { get } from 'svelte/store';
import type { RoleKey } from '$types/index';

function withCtx(): { ctx: AudioContext; out: GainNode } | null {
  if (!audio.ctx) return null;
  const out = audio.buses.sfx;
  if (!out) return null;
  if (!get(audio.settings).sfxEnabled) return null;
  return { ctx: audio.ctx, out };
}

function envelope(
  osc: OscillatorNode,
  g: GainNode,
  t0: number,
  dur: number,
  peak: number,
): void {
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(peak, t0 + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function makeNoise(ctx: AudioContext, dur: number): AudioBuffer {
  const sr = ctx.sampleRate;
  const buf = ctx.createBuffer(1, sr * dur, sr);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

/* ============================================================ */
/* UI SFX                                                       */
/* ============================================================ */

export function click(): void {
  const c = withCtx(); if (!c) return;
  const t0 = c.ctx.currentTime;
  const osc = c.ctx.createOscillator();
  osc.type = 'square';
  osc.frequency.setValueAtTime(1800, t0);
  osc.frequency.exponentialRampToValueAtTime(700, t0 + 0.04);
  const g = c.ctx.createGain();
  osc.connect(g); g.connect(c.out);
  envelope(osc, g, t0, 0.06, 0.18);
}

export function hover(): void {
  const c = withCtx(); if (!c) return;
  const t0 = c.ctx.currentTime;
  const osc = c.ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = 2200;
  const g = c.ctx.createGain();
  osc.connect(g); g.connect(c.out);
  envelope(osc, g, t0, 0.05, 0.05);
}

export function tick(): void {
  const c = withCtx(); if (!c) return;
  const t0 = c.ctx.currentTime;
  const osc = c.ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.value = 1200;
  const g = c.ctx.createGain();
  osc.connect(g); g.connect(c.out);
  envelope(osc, g, t0, 0.05, 0.12);
}

export function cardSelect(): void {
  const c = withCtx(); if (!c) return;
  const t0 = c.ctx.currentTime;
  const osc = c.ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(440, t0);
  osc.frequency.linearRampToValueAtTime(660, t0 + 0.08);
  const g = c.ctx.createGain();
  osc.connect(g); g.connect(c.out);
  envelope(osc, g, t0, 0.12, 0.16);
}

export function notify(): void {
  const c = withCtx(); if (!c) return;
  const t0 = c.ctx.currentTime;
  [880, 1318].forEach((f, i) => {
    const osc = c.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = f;
    const g = c.ctx.createGain();
    osc.connect(g); g.connect(c.out);
    const start = t0 + i * 0.08;
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(0.12, start + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
    osc.start(start); osc.stop(start + 0.35);
  });
}

/* ============================================================ */
/* GAME SFX                                                     */
/* ============================================================ */

export function voteConfirm(): void {
  const c = withCtx(); if (!c) return;
  const t0 = c.ctx.currentTime;
  ([{ f: 392, d: 0 }, { f: 587, d: 0.08 }] as const).forEach(({ f, d }) => {
    const osc = c.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = f;
    const g = c.ctx.createGain();
    osc.connect(g); g.connect(c.out);
    envelope(osc, g, t0 + d, 0.18, 0.22);
  });
}

export function roleReveal(role: RoleKey): void {
  const c = withCtx(); if (!c) return;
  const t0 = c.ctx.currentTime;
  // Boom (sub-bass swell)
  const boom = c.ctx.createOscillator();
  boom.type = 'sine';
  boom.frequency.setValueAtTime(80, t0);
  boom.frequency.exponentialRampToValueAtTime(35, t0 + 1.2);
  const bg = c.ctx.createGain();
  boom.connect(bg); bg.connect(c.out);
  bg.gain.setValueAtTime(0, t0);
  bg.gain.linearRampToValueAtTime(0.5, t0 + 0.02);
  bg.gain.exponentialRampToValueAtTime(0.001, t0 + 1.3);
  boom.start(t0); boom.stop(t0 + 1.4);

  // Chord — evil vs town tonality
  const isEvil = role === 'mafia' || role === 'maniac';
  const tones = isEvil ? [277, 311, 415] : [261, 329, 392];
  tones.forEach((f, i) => {
    const osc = c.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = f;
    const flt = c.ctx.createBiquadFilter();
    flt.type = 'lowpass';
    flt.frequency.value = 1200;
    const g = c.ctx.createGain();
    osc.connect(flt); flt.connect(g); g.connect(c.out);
    const start = t0 + 0.3 + i * 0.05;
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(0.18, start + 0.15);
    g.gain.exponentialRampToValueAtTime(0.001, start + 1.6);
    osc.start(start); osc.stop(start + 1.7);
  });
}

export function elimination(): void {
  const c = withCtx(); if (!c) return;
  const t0 = c.ctx.currentTime;
  // Heavy thud
  const thud = c.ctx.createOscillator();
  thud.type = 'sine';
  thud.frequency.setValueAtTime(120, t0);
  thud.frequency.exponentialRampToValueAtTime(40, t0 + 0.4);
  const tg = c.ctx.createGain();
  thud.connect(tg); tg.connect(c.out);
  tg.gain.setValueAtTime(0, t0);
  tg.gain.linearRampToValueAtTime(0.55, t0 + 0.01);
  tg.gain.exponentialRampToValueAtTime(0.001, t0 + 0.6);
  thud.start(t0); thud.stop(t0 + 0.7);
  // Metallic shimmer
  const noise = c.ctx.createBufferSource();
  noise.buffer = makeNoise(c.ctx, 0.4);
  const flt = c.ctx.createBiquadFilter();
  flt.type = 'bandpass';
  flt.frequency.value = 3500;
  flt.Q.value = 4;
  const ng = c.ctx.createGain();
  noise.connect(flt); flt.connect(ng); ng.connect(c.out);
  ng.gain.setValueAtTime(0.4, t0);
  ng.gain.exponentialRampToValueAtTime(0.001, t0 + 0.3);
  noise.start(t0); noise.stop(t0 + 0.35);
}

export function victory(): void {
  const c = withCtx(); if (!c) return;
  const t0 = c.ctx.currentTime;
  [261, 329, 392, 523].forEach((f, i) => {
    const osc = c.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = f;
    const g = c.ctx.createGain();
    osc.connect(g); g.connect(c.out);
    const start = t0 + i * 0.08;
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(0.25, start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, start + 1.2);
    osc.start(start); osc.stop(start + 1.3);
  });
}

export function defeat(): void {
  const c = withCtx(); if (!c) return;
  const t0 = c.ctx.currentTime;
  [392, 311, 233].forEach((f, i) => {
    const osc = c.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = f;
    const g = c.ctx.createGain();
    osc.connect(g); g.connect(c.out);
    const start = t0 + i * 0.18;
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(0.2, start + 0.04);
    g.gain.exponentialRampToValueAtTime(0.001, start + 1.4);
    osc.start(start); osc.stop(start + 1.5);
  });
}

/**
 * Single namespaced export for ergonomic call sites:
 *   import { sfx } from '$lib/audio';
 *   sfx.click();
 */
export const sfx = {
  click,
  hover,
  tick,
  cardSelect,
  notify,
  voteConfirm,
  roleReveal,
  elimination,
  victory,
  defeat,
};
