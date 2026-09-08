import type { Game, GameHistory, CustomPrompt, AppSettings } from '../types';

const KEYS = {
  GAME: 'syncd_current_game',
  HISTORY: 'syncd_history',
  CUSTOM_PROMPTS: 'syncd_custom_prompts',
  SETTINGS: 'syncd_settings',
};

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full or unavailable
  }
}

export const storage = {
  saveGame: (game: Game) => safeSet(KEYS.GAME, game),
  loadGame: (): Game | null => safeGet<Game | null>(KEYS.GAME, null),
  clearGame: () => {
    try { localStorage.removeItem(KEYS.GAME); } catch {}
  },

  saveHistory: (history: GameHistory[]) => safeSet(KEYS.HISTORY, history),
  loadHistory: (): GameHistory[] => safeGet<GameHistory[]>(KEYS.HISTORY, []),
  addToHistory: (entry: GameHistory) => {
    const history = storage.loadHistory();
    storage.saveHistory([entry, ...history].slice(0, 50));
  },
  clearHistory: () => {
    try { localStorage.removeItem(KEYS.HISTORY); } catch {}
  },

  saveCustomPrompts: (prompts: CustomPrompt[]) => safeSet(KEYS.CUSTOM_PROMPTS, prompts),
  loadCustomPrompts: (): CustomPrompt[] => safeGet<CustomPrompt[]>(KEYS.CUSTOM_PROMPTS, []),

  saveSettings: (settings: AppSettings) => safeSet(KEYS.SETTINGS, settings),
  loadSettings: (): AppSettings =>
    safeGet<AppSettings>(KEYS.SETTINGS, {
      soundEffects: true,
      music: false,
      vibration: true,
    }),
};
