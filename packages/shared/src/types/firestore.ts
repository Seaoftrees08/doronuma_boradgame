import { GameRoom, Player, GameState } from './game';

// Document representations might differ slightly from the combined state 
// depending on how timestamps and references are handled, but for now 
// they are essentially the same.

export type RoomDocument = Omit<GameRoom, 'players'>;

export type PlayerDocument = Player;

export type GameStateDocument = GameState;

export interface ActionLogEntry {
  logId?: string; // Often derived from doc ID
  type: string;
  playerId: string;
  targetPlayerId: string | null;
  cardType: string | null;
  message: string;
  timestamp: number; // or Firebase Firestore Timestamp depending on client/server boundary
}
