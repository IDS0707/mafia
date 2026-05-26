/**
 * Audio engine types.
 */

export type BusName = 'master' | 'music' | 'ambient' | 'sfx';

export type MusicMode = 'calm' | 'mystery' | 'tense' | 'climax';

export interface AudioSettings {
  masterEnabled: boolean;
  musicEnabled: boolean;
  sfxEnabled: boolean;
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
}

export interface DroneLayer {
  freq: number;
  type: OscillatorType;
  gain: number;
  filter: number;
}

export interface ModePreset {
  freqs: DroneLayer[];
  lfoSpeed: number;
  lfoDepth: number;
  windGain: number;
  heartbeat: { bpmMin: number; bpmMax: number } | false;
  creaks: boolean;
  whispers: boolean;
  pulse: { bpm: number } | false;
}

export interface ActiveMusic {
  oscillators: OscillatorNode[];
  sources: AudioBufferSourceNode[];
  timers: number[];
  cleanup(): void;
}
