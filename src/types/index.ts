export type Difficulty = 'easy' | 'medium' | 'hard' | 'chaos';

export type Category =
  | 'general'
  | 'food'
  | 'movies-tv'
  | 'sports'
  | 'music'
  | 'gaming'
  | 'everyday'
  | 'funny'
  | 'random'
  | 'family'
  | 'nostalgia'
  | 'hard-trivia';

export type ScoringMode = 'standard' | 'double' | 'streak';

export type GameStatus = 'idle' | 'playing' | 'paused' | 'finished';

export interface Prompt {
  id: string;
  text: string;
  category: Category;
  difficulty: Difficulty;
}

export interface Team {
  id: string;
  name: string;
  score: number;
  matches: number;
  streak: number;
  maxStreak: number;
}

export interface Round {
  roundNumber: number;
  teamId: string;
  promptId: string;
  matched: boolean | null;
  pointsEarned: number;
  partnerAAnswer?: string;
  partnerBAnswer?: string;
}

export interface GameSettings {
  numberOfTeams: number;
  numberOfRounds: number;
  scoringMode: ScoringMode;
  timerSeconds: number | null;
  categories: Category[];
  difficulties: Difficulty[];
  secretAnswerMode: boolean;
  soundEffects: boolean;
  music: boolean;
  vibration: boolean;
  customPromptsOnly: boolean;
  mixCustomPrompts: boolean;
}

export interface Game {
  id: string;
  createdAt: string;
  completedAt?: string;
  teams: Team[];
  rounds: Round[];
  currentRound: number;
  currentTeamIndex: number;
  usedPromptIds: string[];
  settings: GameSettings;
  status: GameStatus;
}

export interface GameHistory {
  id: string;
  completedAt: string;
  teamNames: string[];
  winner: string;
  winnerScore: number;
  totalRounds: number;
  finalScores: Record<string, number>;
}

export interface CustomPrompt {
  id: string;
  text: string;
  createdAt: string;
}

export interface AppSettings {
  soundEffects: boolean;
  music: boolean;
  vibration: boolean;
}

export const CATEGORY_LABELS: Record<Category, string> = {
  general: 'General',
  food: 'Food',
  'movies-tv': 'Movies & TV',
  sports: 'Sports',
  music: 'Music',
  gaming: 'Gaming',
  everyday: 'Everyday Life',
  funny: 'Funny',
  random: 'Random',
  family: 'Family',
  nostalgia: 'Nostalgia',
  'hard-trivia': 'Hard',
};

export const CATEGORY_EMOJIS: Record<Category, string> = {
  general: '🎯',
  food: '🍕',
  'movies-tv': '🎬',
  sports: '⚽',
  music: '🎵',
  gaming: '🎮',
  everyday: '🏠',
  funny: '😂',
  random: '🎲',
  family: '👨‍👩‍👧‍👦',
  nostalgia: '📼',
  'hard-trivia': '🧠',
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  chaos: 'Chaos',
};

export const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy: 'text-green-400',
  medium: 'text-yellow-400',
  hard: 'text-orange-400',
  chaos: 'text-red-400',
};
