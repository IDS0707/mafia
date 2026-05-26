/**
 * Audio module barrel — single entry point.
 *
 * Usage:
 *   import { audio, sfx } from '$lib/audio';
 *   audio.init();              // first user gesture
 *   audio.setMode('mystery');  // night phase
 *   sfx.voteConfirm();         // event hook
 */

export { audio } from './AudioEngine';
export { sfx } from './SFX';
export type { MusicMode, AudioSettings, BusName } from './types';
