import type { ModePreset, MusicMode } from './types';

/**
 * Music mode presets — frequencies, drone layers, modulation depth, layered loops.
 * Tuned for noir/horror/mafia atmosphere.
 */
export const PRESETS: Record<MusicMode, ModePreset> = {
  calm: {
    freqs: [
      { freq: 65.4, type: 'sine', gain: 0.45, filter: 220 },
      { freq: 98.0, type: 'sine', gain: 0.28, filter: 280 },
      { freq: 130.8, type: 'triangle', gain: 0.18, filter: 360 },
    ],
    lfoSpeed: 0.05,
    lfoDepth: 60,
    windGain: 0.04,
    heartbeat: false,
    creaks: false,
    whispers: false,
    pulse: false,
  },
  mystery: {
    freqs: [
      { freq: 55, type: 'sine', gain: 0.6, filter: 160 },
      { freq: 65.4, type: 'sawtooth', gain: 0.18, filter: 240 },
      { freq: 82.4, type: 'sawtooth', gain: 0.14, filter: 280 },
      { freq: 110, type: 'triangle', gain: 0.1, filter: 340 },
    ],
    lfoSpeed: 0.06,
    lfoDepth: 80,
    windGain: 0.08,
    heartbeat: { bpmMin: 50, bpmMax: 60 },
    creaks: true,
    whispers: true,
    pulse: false,
  },
  tense: {
    freqs: [
      { freq: 49, type: 'sawtooth', gain: 0.55, filter: 220 },
      { freq: 73.4, type: 'sawtooth', gain: 0.22, filter: 320 },
      { freq: 87.3, type: 'square', gain: 0.12, filter: 400 },
    ],
    lfoSpeed: 0.18,
    lfoDepth: 140,
    windGain: 0.12,
    heartbeat: { bpmMin: 95, bpmMax: 115 },
    creaks: true,
    whispers: false,
    pulse: { bpm: 110 },
  },
  climax: {
    freqs: [
      { freq: 41, type: 'sawtooth', gain: 0.7, filter: 200 },
      { freq: 61.7, type: 'sawtooth', gain: 0.3, filter: 320 },
      { freq: 82.4, type: 'square', gain: 0.18, filter: 420 },
      { freq: 165, type: 'sawtooth', gain: 0.08, filter: 600 },
    ],
    lfoSpeed: 0.25,
    lfoDepth: 200,
    windGain: 0.18,
    heartbeat: { bpmMin: 110, bpmMax: 130 },
    creaks: true,
    whispers: true,
    pulse: { bpm: 130 },
  },
};
