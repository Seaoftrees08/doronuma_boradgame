export type PlayerStatus = "waiting" | "ready" | "playing" | "afk" | "observer";

export type CardType = 
  | "Harassment" 
  | "Accomplice" 
  | "Barrage" 
  | "Nullify" 
  | "Deflect" 
  | "DoubleBack" 
  | "Plunder" 
  | "CutDown" 
  | "SuddenDeath";

export interface ActionCard {
  id: string;
  type: CardType;
}

export interface VictoryPointCard {
  points: number;
}

export interface GameSettings {
  maxPlayers: number;
  turnTimeLimit: number;
  interruptTimeLimit: number;
  suddenDeathRange: number;
  deckConfig: Record<string, number>;
}

export interface Player {
  playerId: string;
  name: string;
  score: number;
  handCount: number;
  status: PlayerStatus;
  joinedAt: number;
  consecutiveTimeouts: number;
}

export interface GameRoom {
  roomId: string;
  hostId: string;
  status: "lobby" | "playing" | "finished";
  settings: GameSettings;
  createdAt: number;
  players: Record<string, Player>;
}

export type GamePhase = "setup" | "playing" | "interrupt" | "lastRound" | "finished";

export interface GameState {
  phase: GamePhase;
  currentTurnPlayerId: string;
  turnOrder: string[];
  turnNumber: number;
  deckRemaining: number;
  discardCount: number;
  suddenDeathTriggered: boolean;
  suddenDeathTriggeredBy: string | null;
  targetActionCount: number | null;
  actionCountPerPlayer: Record<string, number>;
  turnDeadline: number;
  interruptDeadline: number | null;
  currentAction: TurnAction | null;
  interruptStack: InterruptAction[];
  needsDiscard: boolean;
  discardPlayerId: string | null;
}

export type TurnActionType = "drawTwo" | "drawOnePlayOne" | "discardPlayTwo" | "pass";

export interface TurnAction {
  type: TurnActionType;
  playerId: string;
  playedCards: ActionCard[];
  discardedCards?: ActionCard[];
  targetPlayerId?: string;
}

export interface InterruptAction {
  playerId: string;
  playedCard: ActionCard;
  targetPlayerId?: string;
  targetActionId?: string; // Optional: The ID of the action being interrupted
}

export interface DiscardAction {
  playerId: string;
  discardedCards: ActionCard[];
}
