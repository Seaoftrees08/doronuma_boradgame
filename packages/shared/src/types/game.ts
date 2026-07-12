export type PlayerStatus = "waiting" | "ready" | "playing" | "afk" | "observer";

export type CardType = 
  // 得点取得系
  | "GainOne" | "GainTwo" | "GainThree"
  // 妨害系
  | "Harassment" | "Accomplice" | "Barrage" | "QuagmireDrag"
  // 妨害への対抗
  | "Nullify" | "Deflect" | "DoubleBack" | "Repel"
  // 強奪・妨害
  | "Plunder" | "HandRaid" | "CutDown" | "Share"
  // 特殊
  | "SuddenDeath";

export interface ActionCard {
  id: string;
  type: CardType;
}

export type VictoryCardType = 'PlusOne' | 'PlusThree' | 'PlusFive' | 'MinusThree';

export interface VictoryPointCard {
  type: VictoryCardType;
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
  synthesisPhase: boolean;
  victoryCards: Record<string, VictoryPointCard[]>;
}

export type TurnAction =
  | { type: 'drawTwo'; playerId?: string }
  | { type: 'drawOnePlayOne'; cardId?: string; playerId?: string; targetPlayerId?: string; step?: 'draw' | 'play' }
  | { type: 'discardPlayTwo'; discardCardId: string; playCardIds: string[]; playerId?: string; targetPlayerId?: string }
  | { type: 'pass'; playerId?: string }
  | { type: 'synthesize'; synthesisType: 'small' | 'large'; playerId?: string };

export type TurnActionType = TurnAction['type'];

export interface InterruptAction {
  playerId: string;
  playedCard: ActionCard;
  targetPlayerId?: string;
  targetActionId?: string; // Optional: The ID of the action being interrupted
}
