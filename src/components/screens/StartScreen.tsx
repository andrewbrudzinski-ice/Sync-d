import { motion } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import { Button } from '../ui/Button';
import { useEffect } from 'react';

export function StartScreen() {
  const { setScreen, game, loadHistory, loadCustomPrompts, loadAppSettings } = useGameStore();

  useEffect(() => {
    loadHistory();
    loadCustomPrompts();
    loadAppSettings();
  }, []);

  const hasActiveGame = game && game.status === 'playing';

  return (
    <div className="bg-game min-h-dvh flex flex-col items-center justify-between px-6 safe-top safe-bottom">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-purple-700/20 blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-pink-700/15 blur-3xl" />
        <div className="absolute top-[40%] right-[10%] w-[30vw] h-[30vw] rounded-full bg-violet-600/10 blur-2xl" />
      </div>

      {/* Top navigation */}
      <div className="w-full max-w-sm flex justify-between items-center pt-4 z-10">
        <button
          onClick={() => setScreen('history')}
          className="text-white/50 hover:text-white/80 transition-colors p-2 rounded-xl hover:bg-white/10"
          aria-label="Game History"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button
          onClick={() => setScreen('settings')}
          className="text-white/50 hover:text-white/80 transition-colors p-2 rounded-xl hover:bg-white/10"
          aria-label="Settings"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Hero */}
      <div className="flex flex-col items-center gap-8 z-10 mt-4 w-full max-w-sm">
        {/* Logo / icon */}
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
          className="relative"
        >
          <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center shadow-2xl shadow-purple-900/50 glow-purple">
            <span className="text-5xl select-none" role="img" aria-label="Sync'd">🧠</span>
          </div>
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -inset-3 rounded-[2rem] border border-purple-500/30"
          />
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-center"
        >
          <h1 className="text-6xl font-black tracking-tight gradient-text mb-2">
            Sync'd
          </h1>
          <p className="text-white/60 text-lg font-medium">
            Think together. Match perfectly.
          </p>
        </motion.div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="w-full flex gap-3 justify-center"
        >
          {[
            { icon: '👥', label: 'Teams of 2' },
            { icon: '💬', label: 'Same answer' },
            { icon: '🏆', label: 'Win points' },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-1 bg-white/5 rounded-2xl px-4 py-3 flex-1 border border-white/10">
              <span className="text-2xl">{item.icon}</span>
              <span className="text-xs text-white/60 font-medium text-center">{item.label}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.5 }}
        className="w-full max-w-sm flex flex-col gap-3 pb-6 z-10"
      >
        {hasActiveGame && (
          <Button
            variant="success"
            size="lg"
            fullWidth
            onClick={() => setScreen('gameplay')}
          >
            ▶ Resume Game
          </Button>
        )}
        <Button
          variant="primary"
          size="xl"
          fullWidth
          onClick={() => setScreen('setup')}
        >
          {hasActiveGame ? 'New Game' : 'Start Game'}
        </Button>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            size="md"
            fullWidth
            onClick={() => setScreen('how-to-play')}
          >
            How to Play
          </Button>
          <Button
            variant="secondary"
            size="md"
            fullWidth
            onClick={() => setScreen('custom-prompts')}
          >
            Custom Prompts
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
