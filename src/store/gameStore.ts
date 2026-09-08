import { create } from 'zustand';
import type {
  Game,
  Team,
  GameSettings,
  Prompt,
  GameHistory,
  CustomPrompt,
  AppSettings,
  Category,
} from '../types';
import { PROMPTS, shufflePrompts, getPromptsByFilter } from '../data/prompts';
import { storage } from '../utils/storage';

export type Screen =
  | 'start'
  | 'how-to-play'
  | 'setup'
  | 'gameplay'
  | 'results'
  | 'history'
  | 'settings'
  | 'custom-prompts';

const ALL_CATEGORIES: Category[] = [
  'general', 'food', 'movies-tv', 'sports', 'music',
  'gaming', 'everyday', 'funny', 'random', 'family',
  'nostalgia', 'hard-trivia',
];

const DEFAULT_SETTINGS: GameSettings = {
  numberOfTeams: 2,
  numberOfRounds: 10,
  scoringMode: 'standard',
  timerSeconds: 15,
  categories: ALL_CATEGORIES,
  difficulties: ['easy', 'medium'],
  secretAnswerMode: false,
  soundEffects: true,
  music: false,
  vibration: true,
  customPromptsOnly: false,
  mixCustomPrompts: true,
};

interface GameStore {
  screen: Screen;
  game: Game | null;
  setupSettings: GameSettings;
  teamNames: string[];
  history: GameHistory[];
  customPrompts: CustomPrompt[];
  appSettings: AppSettings;
  promptQueue: Prompt[];
  showHostMenu: boolean;

  // Navigation
  setScreen: (s: Screen) => void;

  // Setup
  updateSetupSettings: (partial: Partial<GameSettings>) => void;
  updateTeamName: (index: number, name: string) => void;
  resetSetup: () => void;

  // Game lifecycle
  startGame: () => void;
  submitResult: (matched: boolean) => void;
  skipPrompt: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  endGame: () => void;
  editScore: (teamId: string, newScore: number) => void;
  restartRound: () => void;

  // Host menu
  setShowHostMenu: (v: boolean) => void;

  // History
  loadHistory: () => void;
  clearHistory: () => void;

  // Custom prompts
  loadCustomPrompts: () => void;
  addCustomPrompt: (text: string) => void;
  removeCustomPrompt: (id: string) => void;

  // App settings
  loadAppSettings: () => void;
  updateAppSettings: (partial: Partial<AppSettings>) => void;

  // Current prompt
  currentPrompt: () => Prompt | null;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function buildDefaultTeamNames(n: number): string[] {
  return Array.from({ length: n }, (_, i) => `Team ${i + 1}`);
}

function buildTeams(names: string[]): Team[] {
  return names.map((name) => ({
    id: generateId(),
    name,
    score: 0,
    matches: 0,
    streak: 0,
    maxStreak: 0,
  }));
}

function buildPromptQueue(settings: GameSettings, custom: CustomPrompt[]): Prompt[] {
  let pool: Prompt[] = [];

  if (!settings.customPromptsOnly) {
    pool = getPromptsByFilter(settings.categories, settings.difficulties);
    if (pool.length === 0) pool = PROMPTS;
  }

  if (settings.mixCustomPrompts || settings.customPromptsOnly) {
    const cp: Prompt[] = custom.map((c) => ({
      id: c.id,
      text: c.text,
      category: 'general',
      difficulty: 'medium',
    }));
    pool = settings.customPromptsOnly ? cp : [...pool, ...cp];
  }

  if (pool.length === 0) pool = PROMPTS;

  return shufflePrompts(pool);
}

export const useGameStore = create<GameStore>((set, get) => ({
  screen: 'start',
  game: storage.loadGame(),
  setupSettings: { ...DEFAULT_SETTINGS },
  teamNames: buildDefaultTeamNames(DEFAULT_SETTINGS.numberOfTeams),
  history: [],
  customPrompts: [],
  appSettings: storage.loadSettings(),
  promptQueue: [],
  showHostMenu: false,

  setScreen: (screen) => set({ screen }),

  updateSetupSettings: (partial) => {
    const next = { ...get().setupSettings, ...partial };
    // Sync team count with team names array
    if (partial.numberOfTeams !== undefined) {
      const names = get().teamNames;
      const n = partial.numberOfTeams;
      if (n > names.length) {
        const extra = Array.from({ length: n - names.length }, (_, i) => `Team ${names.length + i + 1}`);
        set({ teamNames: [...names, ...extra] });
      } else {
        set({ teamNames: names.slice(0, n) });
      }
    }
    set({ setupSettings: next });
  },

  updateTeamName: (index, name) => {
    const names = [...get().teamNames];
    names[index] = name;
    set({ teamNames: names });
  },

  resetSetup: () => {
    set({
      setupSettings: { ...DEFAULT_SETTINGS },
      teamNames: buildDefaultTeamNames(DEFAULT_SETTINGS.numberOfTeams),
    });
  },

  startGame: () => {
    const { setupSettings, teamNames, customPrompts } = get();
    const teams = buildTeams(teamNames.slice(0, setupSettings.numberOfTeams));
    const queue = buildPromptQueue(setupSettings, customPrompts);

    const game: Game = {
      id: generateId(),
      createdAt: new Date().toISOString(),
      teams,
      rounds: [],
      currentRound: 1,
      currentTeamIndex: 0,
      usedPromptIds: [],
      settings: { ...setupSettings },
      status: 'playing',
    };

    storage.saveGame(game);
    set({ game, promptQueue: queue, screen: 'gameplay' });
  },

  currentPrompt: () => {
    const { game, promptQueue } = get();
    if (!game) return null;
    const available = promptQueue.filter((p) => !game.usedPromptIds.includes(p.id));
    if (available.length === 0) {
      const reshuffled = shufflePrompts(promptQueue);
      return reshuffled[0] ?? null;
    }
    return available[0];
  },

  skipPrompt: () => {
    const { game } = get();
    if (!game) return;
    const prompt = get().currentPrompt();
    if (!prompt) return;
    const usedPromptIds = [...game.usedPromptIds, prompt.id];
    const updatedGame = { ...game, usedPromptIds };
    storage.saveGame(updatedGame);
    set({ game: updatedGame });
  },

  submitResult: (matched) => {
    const { game, promptQueue } = get();
    if (!game) return;

    const prompt = get().currentPrompt();
    if (!prompt) return;

    const team = game.teams[game.currentTeamIndex];
    const settings = game.settings;

    // Calculate points
    let pointsEarned = 0;
    if (matched) {
      if (settings.scoringMode === 'standard') pointsEarned = 1;
      else if (settings.scoringMode === 'double') pointsEarned = 2;
      else if (settings.scoringMode === 'streak') {
        pointsEarned = team.streak + 1;
      }
    }

    // Update teams
    const updatedTeams = game.teams.map((t) => {
      if (t.id !== team.id) return t;
      const newStreak = matched ? t.streak + 1 : 0;
      return {
        ...t,
        score: t.score + pointsEarned,
        matches: t.matches + (matched ? 1 : 0),
        streak: newStreak,
        maxStreak: Math.max(t.maxStreak, newStreak),
      };
    });

    const round = {
      roundNumber: game.currentRound,
      teamId: team.id,
      promptId: prompt.id,
      matched,
      pointsEarned,
    };

    const usedPromptIds = [...game.usedPromptIds, prompt.id];

    // Advance to next team / round
    const totalTeams = game.teams.length;
    let nextTeamIndex = game.currentTeamIndex + 1;
    let nextRound = game.currentRound;
    let status: Game['status'] = 'playing';

    if (nextTeamIndex >= totalTeams) {
      nextTeamIndex = 0;
      nextRound = game.currentRound + 1;
      if (nextRound > game.settings.numberOfRounds) {
        status = 'finished';
      }
    }

    const updatedGame: Game = {
      ...game,
      teams: updatedTeams,
      rounds: [...game.rounds, round],
      currentRound: nextRound,
      currentTeamIndex: nextTeamIndex,
      usedPromptIds,
      status,
    };

    // Reshuffle if we run out
    let newQueue = promptQueue;
    const available = newQueue.filter((p) => !usedPromptIds.includes(p.id));
    if (available.length === 0) {
      newQueue = shufflePrompts(promptQueue);
    }

    if (status === 'finished') {
      updatedGame.completedAt = new Date().toISOString();
      const sorted = [...updatedTeams].sort((a, b) => b.score - a.score);
      const winner = sorted[0];
      const historyEntry: GameHistory = {
        id: game.id,
        completedAt: updatedGame.completedAt,
        teamNames: updatedTeams.map((t) => t.name),
        winner: winner.name,
        winnerScore: winner.score,
        totalRounds: game.settings.numberOfRounds,
        finalScores: Object.fromEntries(updatedTeams.map((t) => [t.name, t.score])),
      };
      storage.addToHistory(historyEntry);
      storage.clearGame();
      set({ game: updatedGame, promptQueue: newQueue, screen: 'results', history: storage.loadHistory() });
    } else {
      storage.saveGame(updatedGame);
      set({ game: updatedGame, promptQueue: newQueue });
    }
  },

  pauseGame: () => {
    const { game } = get();
    if (!game) return;
    const updated = { ...game, status: 'paused' as const };
    storage.saveGame(updated);
    set({ game: updated });
  },

  resumeGame: () => {
    const { game } = get();
    if (!game) return;
    const updated = { ...game, status: 'playing' as const };
    storage.saveGame(updated);
    set({ game: updated, showHostMenu: false });
  },

  endGame: () => {
    storage.clearGame();
    set({ game: null, screen: 'start', showHostMenu: false });
  },

  editScore: (teamId, newScore) => {
    const { game } = get();
    if (!game) return;
    const updatedTeams = game.teams.map((t) =>
      t.id === teamId ? { ...t, score: Math.max(0, newScore) } : t
    );
    const updated = { ...game, teams: updatedTeams };
    storage.saveGame(updated);
    set({ game: updated });
  },

  restartRound: () => {
    const { game } = get();
    if (!game) return;
    const updated = { ...game, currentTeamIndex: 0 };
    storage.saveGame(updated);
    set({ game: updated, showHostMenu: false });
  },

  setShowHostMenu: (v) => set({ showHostMenu: v }),

  loadHistory: () => set({ history: storage.loadHistory() }),
  clearHistory: () => {
    storage.clearHistory();
    set({ history: [] });
  },

  loadCustomPrompts: () => set({ customPrompts: storage.loadCustomPrompts() }),
  addCustomPrompt: (text) => {
    const prompts = [...get().customPrompts, { id: generateId(), text, createdAt: new Date().toISOString() }];
    storage.saveCustomPrompts(prompts);
    set({ customPrompts: prompts });
  },
  removeCustomPrompt: (id) => {
    const prompts = get().customPrompts.filter((p) => p.id !== id);
    storage.saveCustomPrompts(prompts);
    set({ customPrompts: prompts });
  },

  loadAppSettings: () => set({ appSettings: storage.loadSettings() }),
  updateAppSettings: (partial) => {
    const next = { ...get().appSettings, ...partial };
    storage.saveSettings(next);
    set({ appSettings: next });
  },
}));
