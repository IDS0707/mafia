/**
 * Shared domain types. Single source of truth for cross-module shapes.
 */

export type Lang = 'en' | 'ru' | 'uz';

export type RoleKey =
  | 'mafia'
  | 'doctor'
  | 'sheriff'
  | 'civilian'
  | 'maniac'
  | 'jester';

export type Team = 'mafia' | 'town' | 'solo';

export interface RoleDef {
  key: RoleKey;
  team: Team;
  color: 'red' | 'blue' | 'gold' | 'gray' | 'violet' | 'pink';
  descKeys: readonly [string, string];
}

export interface User {
  name: string;
  email: string;
  gold: number;
  gems: number;
  level: number;
  xp: number;
  xpNeeded: number;
  games: number;
  wins: number;
  avatar: AvatarKey;
}

export type AvatarKey =
  | 'a-don' | 'a-joker' | 'a-azik' | 'a-samurai' | 'a-cherry'
  | 'a-queen' | 'a-umid' | 'a-shadow' | 'a-black' | 'a-mrn';

export interface Player {
  id: string;
  name: string;
  avatar: AvatarKey;
  isBot: boolean;
  ready: boolean;
  alive: boolean;
  isHost: boolean;
  role: RoleKey | null;
}

export type Visibility = 'public' | 'private';
export type GameMode = 'classic' | 'rapid' | 'ranked';

export interface Room {
  code: string;
  vis: Visibility;
  mode: GameMode;
  max: number;
  time: number;
  hostId: string;
  players: Player[];
  createdAt: number;
}

export type GamePhase =
  | 'role-reveal'
  | 'night'
  | 'dawn'
  | 'day'
  | 'vote'
  | 'result'
  | 'over';

export interface NightActions {
  mafia?: string;   // targetId
  doctor?: string;
  sheriff?: string;
  maniac?: string;
}

export interface ChatEntry {
  ts: number;
  system?: boolean;
  html?: string;
  player?: Player;
  text?: string;
}

export interface Game {
  day: number;
  phase: GamePhase;
  nightActions: NightActions;
  votes: Record<string, string>; // voterId -> targetId
  chat: ChatEntry[];
}

export type ViewName =
  | 'splash'
  | 'auth'
  | 'menu'
  | 'create'
  | 'join'
  | 'lobby'
  | 'game'
  | 'profile'
  | 'shop'
  | 'leaderboard';
