/**
 * AudioEngine — production-grade adaptive audio system.
 *
 * Architecture:
 *   destination
 *      ↑
 *    master (gain) → highshelf EQ
 *      ↑
 *   ┌──┼──────┬──────┐
 *   music  ambient  sfx
 *
 * Features:
 *   • Bus-routed mixing with independent volume + mute per bus
 *   • Smooth crossfade between music modes (no hard cuts)
 *   • Last-N-seconds riser overlay for countdown intensification
 *   • Persistent settings (localStorage)
 *   • Lazy AudioContext init (browsers require user gesture)
 *   • Memory-safe oscillator cleanup on stop / mode switch
 */

import { writable, get, type Writable } from 'svelte/store';
import { readJSON, writeJSON } from '$lib/utils/storage';
import { randInt } from '$lib/utils/random';
import { PRESETS } from './presets';
import type {
  ActiveMusic,
  AudioSettings,
  BusName,
  MusicMode,
} from './types';

const STORAGE_KEY = 'audio:v2';

const DEFAULTS: AudioSettings = {
  masterEnabled: true,
  musicEnabled: true,
  sfxEnabled: true,
  masterVolume: 0.8,
  musicVolume: 0.7,
  sfxVolume: 0.85,
};

class AudioEngineImpl {
  ctx: AudioContext | null = null;
  buses: Record<BusName, GainNode | null> = {
    master: null,
    music: null,
    ambient: null,
    sfx: null,
  };

  /** Reactive settings — UI binds to this. */
  readonly settings: Writable<AudioSettings> = writable<AudioSettings>({
    ...DEFAULTS,
    ...readJSON<Partial<AudioSettings>>(STORAGE_KEY, {}),
  });

  /** Current music mode (reactive for UI badges). */
  readonly mode: Writable<MusicMode> = writable<MusicMode>('calm');

  private active: ActiveMusic | null = null;
  private riser: { osc: OscillatorNode; gain: GainNode } | null = null;

  constructor() {
    // Persist settings on every change.
    this.settings.subscribe((s) => {
      writeJSON(STORAGE_KEY, s);
      this.applyVolumes(s);
    });
  }

  /* ---------------------------------------------------------- */
  /* Lifecycle                                                  */
  /* ---------------------------------------------------------- */

  /** Create AudioContext + bus graph. Idempotent. Must be called after user gesture. */
  init(): void {
    if (this.ctx) return;
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();

    const master = this.ctx.createGain();
    const shelf = this.ctx.createBiquadFilter();
    shelf.type = 'highshelf';
    shelf.frequency.value = 5200;
    shelf.gain.value = -5;
    master.connect(shelf);
    shelf.connect(this.ctx.destination);

    const music = this.ctx.createGain();
    const ambient = this.ctx.createGain();
    const sfx = this.ctx.createGain();
    music.connect(master);
    ambient.connect(master);
    sfx.connect(master);

    this.buses = { master, music, ambient, sfx };
    this.applyVolumes(get(this.settings));
  }

  /** Resume context (browsers suspend until user gesture). */
  async resume(): Promise<void> {
    if (this.ctx?.state === 'suspended') await this.ctx.resume();
  }

  private applyVolumes(s: AudioSettings): void {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const ramp = 0.25;
    const masterV = s.masterEnabled ? s.masterVolume : 0;
    const musicV = s.musicEnabled ? s.musicVolume : 0;
    const sfxV = s.sfxEnabled ? s.sfxVolume : 0;
    this.buses.master?.gain.cancelScheduledValues(t);
    this.buses.master?.gain.linearRampToValueAtTime(masterV, t + ramp);
    this.buses.music?.gain.linearRampToValueAtTime(musicV, t + ramp);
    this.buses.ambient?.gain.linearRampToValueAtTime(masterV, t + ramp);
    this.buses.sfx?.gain.linearRampToValueAtTime(sfxV, t + ramp);
  }

  /* ---------------------------------------------------------- */
  /* Settings API                                               */
  /* ---------------------------------------------------------- */

  setVolume(bus: 'master' | 'music' | 'sfx', value: number): void {
    const v = Math.max(0, Math.min(1, value));
    this.settings.update((s) => ({ ...s, [`${bus}Volume`]: v }));
  }

  toggleBus(bus: 'master' | 'music' | 'sfx'): void {
    this.settings.update((s) => ({ ...s, [`${bus}Enabled`]: !s[`${bus}Enabled`] }));
    if (bus === 'music' && !get(this.settings).musicEnabled) {
      this.stopMusic();
    } else if (bus === 'music' && get(this.settings).musicEnabled) {
      this.playMode(get(this.mode));
    }
  }

  /* ---------------------------------------------------------- */
  /* Music — crossfaded mode switching                          */
  /* ---------------------------------------------------------- */

  /** Switch music mode with smooth crossfade. */
  async setMode(mode: MusicMode, opts: { crossfade?: number } = {}): Promise<void> {
    if (get(this.mode) === mode && this.active) return;
    this.mode.set(mode);
    if (!get(this.settings).musicEnabled) return;
    if (!this.ctx) {
      this.playMode(mode);
      return;
    }
    const fade = opts.crossfade ?? 0.9;
    const t = this.ctx.currentTime;
    const target = get(this.settings).musicVolume;

    // Fade current music bus down
    this.buses.music?.gain.cancelScheduledValues(t);
    this.buses.music?.gain.linearRampToValueAtTime(0, t + fade);

    // After fade, swap drone group and fade back in
    await new Promise<void>((r) => setTimeout(r, fade * 1000 + 50));
    this.stopMusic();
    this.playMode(mode);
    const t2 = this.ctx!.currentTime;
    this.buses.music?.gain.cancelScheduledValues(t2);
    this.buses.music!.gain.setValueAtTime(0, t2);
    this.buses.music!.gain.linearRampToValueAtTime(target, t2 + fade + 0.3);
  }

  /** Internal — build oscillator group for a mode and connect. */
  private playMode(mode: MusicMode): void {
    if (!this.ctx) return;
    const preset = PRESETS[mode];
    const out = this.buses.music;
    if (!out) return;

    const oscillators: OscillatorNode[] = [];
    const sources: AudioBufferSourceNode[] = [];
    const timers: number[] = [];
    const now = this.ctx.currentTime;

    // 1. Drone layers (each with ±7 cent detune for thickness)
    preset.freqs.forEach((layer) => {
      [-7, 0, 7].forEach((detune) => {
        const osc = this.ctx!.createOscillator();
        osc.type = layer.type;
        osc.frequency.value = layer.freq;
        osc.detune.value = detune;
        const f = this.ctx!.createBiquadFilter();
        f.type = 'lowpass';
        f.frequency.value = layer.filter;
        f.Q.value = 1.4;
        const g = this.ctx!.createGain();
        g.gain.value = 0;
        g.gain.linearRampToValueAtTime(layer.gain / 3, now + 2.5);
        osc.connect(f);
        f.connect(g);
        g.connect(out);
        osc.start(now);
        oscillators.push(osc);
      });
    });

    // 2. LFO sweeping filter cutoffs
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = preset.lfoSpeed;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = preset.lfoDepth;
    lfo.connect(lfoGain);
    lfo.start(now);
    oscillators.push(lfo);

    // 3. Wind (filtered noise)
    if (preset.windGain > 0) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.makeNoiseBuffer(4);
      noise.loop = true;
      const nf = this.ctx.createBiquadFilter();
      nf.type = 'bandpass';
      nf.frequency.value = 380;
      nf.Q.value = 0.8;
      const ng = this.ctx.createGain();
      ng.gain.value = 0;
      ng.gain.linearRampToValueAtTime(preset.windGain, now + 4);
      const windLfo = this.ctx.createOscillator();
      windLfo.type = 'sine';
      windLfo.frequency.value = 0.13;
      const windGain = this.ctx.createGain();
      windGain.gain.value = 220;
      windLfo.connect(windGain);
      windGain.connect(nf.frequency);
      windLfo.start(now);
      noise.connect(nf);
      nf.connect(ng);
      ng.connect(out);
      noise.start(now);
      sources.push(noise);
      oscillators.push(windLfo);
    }

    // 4. Heartbeat
    if (preset.heartbeat) {
      const hb = preset.heartbeat;
      const tick = (): void => {
        if (!this.ctx) return;
        const bpm = hb.bpmMin + Math.random() * (hb.bpmMax - hb.bpmMin);
        const beatMs = 60000 / bpm;
        this.playThump(0);
        timers.push(window.setTimeout(() => this.playThump(1), Math.max(160, 360 - bpm * 2)));
        timers.push(window.setTimeout(tick, beatMs));
      };
      timers.push(window.setTimeout(tick, 1200));
    }

    // 5. Creaks (sparse dissonant glides)
    if (preset.creaks) {
      const creak = (): void => {
        if (!this.ctx) return;
        this.playCreak();
        timers.push(window.setTimeout(creak, 5000 + Math.random() * 9000));
      };
      timers.push(window.setTimeout(creak, 3000 + Math.random() * 4000));
    }

    // 6. Whispers
    if (preset.whispers) {
      const whisper = (): void => {
        if (!this.ctx) return;
        this.playWhisper();
        timers.push(window.setTimeout(whisper, 8000 + Math.random() * 12000));
      };
      timers.push(window.setTimeout(whisper, 5000 + Math.random() * 5000));
    }

    // 7. Driving low pulse (tense/climax)
    if (preset.pulse) {
      const beatMs = 60000 / preset.pulse.bpm;
      const iv = window.setInterval(() => this.playPulse(), beatMs);
      timers.push(iv);
    }

    this.active = {
      oscillators,
      sources,
      timers,
      cleanup: () => {
        oscillators.forEach((o) => {
          try { o.stop(); } catch { /* */ }
        });
        sources.forEach((s) => {
          try { s.stop(); } catch { /* */ }
        });
        timers.forEach((id) => {
          clearTimeout(id);
          clearInterval(id);
        });
      },
    };
  }

  stopMusic(): void {
    this.active?.cleanup();
    this.active = null;
  }

  /* ---------------------------------------------------------- */
  /* Riser — last-N-seconds intensification                     */
  /* ---------------------------------------------------------- */

  startRiser(durationSec: number): void {
    if (!this.ctx || !get(this.settings).musicEnabled) return;
    this.stopRiser();
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, t0);
    osc.frequency.exponentialRampToValueAtTime(900, t0 + durationSec);
    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.setValueAtTime(300, t0);
    f.frequency.exponentialRampToValueAtTime(2500, t0 + durationSec);
    f.Q.value = 2.5;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.18, t0 + durationSec * 0.7);
    g.gain.linearRampToValueAtTime(0.3, t0 + durationSec);
    osc.connect(f);
    f.connect(g);
    g.connect(this.buses.music!);
    osc.start(t0);
    osc.stop(t0 + durationSec + 0.1);
    this.riser = { osc, gain: g };
  }

  stopRiser(): void {
    if (this.riser) {
      try { this.riser.osc.stop(); } catch { /* */ }
      this.riser = null;
    }
  }

  /* ---------------------------------------------------------- */
  /* One-shot helpers used by drone scheduling                  */
  /* ---------------------------------------------------------- */

  private playThump(variant: 0 | 1): void {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    const baseF = variant === 0 ? 52 : 44;
    osc.frequency.setValueAtTime(baseF, t0);
    osc.frequency.exponentialRampToValueAtTime(28, t0 + 0.18);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.5, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.22);
    osc.connect(g);
    g.connect(this.buses.music!);
    osc.start(t0);
    osc.stop(t0 + 0.25);
  }

  private playCreak(): void {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180 + randInt(120), t0);
    osc.frequency.exponentialRampToValueAtTime(60, t0 + 0.6);
    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 600;
    f.Q.value = 6;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.06, t0 + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.8);
    osc.connect(f);
    f.connect(g);
    g.connect(this.buses.music!);
    osc.start(t0);
    osc.stop(t0 + 1);
  }

  private playWhisper(): void {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1800 + randInt(800), t0);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.025, t0 + 0.2);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + 1.8);
    osc.connect(g);
    g.connect(this.buses.music!);
    osc.start(t0);
    osc.stop(t0 + 2);
  }

  private playPulse(): void {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = 41;
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 200;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.22, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.12);
    osc.connect(f);
    f.connect(g);
    g.connect(this.buses.music!);
    osc.start(t0);
    osc.stop(t0 + 0.15);
  }

  private makeNoiseBuffer(seconds: number): AudioBuffer {
    const sr = this.ctx!.sampleRate;
    const buf = this.ctx!.createBuffer(1, sr * seconds, sr);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }
}

// Singleton export
export const audio = new AudioEngineImpl();
