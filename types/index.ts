export enum GameState {
  IDLE = 'IDLE',
  PRE_MATCH_CONFIG = 'PRE_MATCH_CONFIG',
  MATCHMAKING = 'MATCHMAKING',
  ROUND_ACTIVE = 'ROUND_ACTIVE',
  ROUND_RESULTS = 'ROUND_RESULTS',
  GAME_SUMMARY = 'GAME_SUMMARY',
  ERROR = 'ERROR',
}

export type FSMAction =
  | 'startMatchSetup'
  | 'confirmConfig'
  | 'cancelSetup'
  | 'matchFound'
  | 'submitAnswer'
  | 'timerExpired'
  | 'nextRound'
  | 'returnToLobby';

export type RoundCount = 5 | 6 | 7;

export type MatchMode = 'bot' | 'pvp';

export interface MatchConfig {
  totalRounds: RoundCount;
  currentRound: number;
  timePerRound: number;
  lifelineUsed: boolean;
  matchMode: MatchMode;
}

export interface Question {
  id: string;
  scenario: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
}

export interface RoundResult {
  roundNumber: number;
  questionId: string;
  playerAnswer: string | null;
  correctAnswer: string;
  isCorrect: boolean;
  pointsEarned: number;
  timeUsed: number;
  lifelineUsedThisRound: boolean;
}

export interface UserProfile {
  username: string;
  elo: number;
  wins: number;
  losses: number;
  totalMatches: number;
  currentStreak: number;
  bestStreak: number;
  joinDate: string;
}

export interface AppSettings {
  soundEnabled: boolean;
  hapticEnabled: boolean;
}

export type RankTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';

export interface MatchHistoryItem {
  id: string;
  date: string;
  opponent: string;
  playerScore: number;
  opponentScore: number;
  isWin: boolean;
  eloChange: number;
  rounds: RoundResult[];
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  elo: number;
  tier: RankTier;
  isCurrentUser?: boolean;
}

export interface OpponentProfile {
  id: string;
  username: string;
  elo: number;
}

export interface MatchRoom {
  id: string;
  players: [OpponentProfile, OpponentProfile];
  isReady: boolean;
  roundAnswers: (RoundResult | null)[];
}

export interface NetworkMessage {
  type: 'match_found' | 'answer_submitted' | 'round_end' | 'match_end';
  payload: unknown;
}