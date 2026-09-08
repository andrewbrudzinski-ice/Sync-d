import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import { Button } from '../ui/Button';

export function CustomPromptsScreen() {
  const { setScreen, customPrompts, addCustomPrompt, removeCustomPrompt } = useGameStore();
  const [newPrompt, setNewPrompt] = useState('');
  const [adding, setAdding] = useState(false);

  const handleAdd = () => {
    const trimmed = newPrompt.trim();
    if (!trimmed) return;
    addCustomPrompt(trimmed);
    setNewPrompt('');
    setAdding(false);
  };

  return (
    <div className="bg-game min-h-dvh flex flex-col">
      <div className="sticky top-0 z-20 bg-[#0f0f1a]/90 backdrop-blur border-b border-white/10">
        <div className="flex items-center gap-4 px-6 py-4 max-w-lg mx-auto w-full">
          <button
            onClick={() => setScreen('start')}
            className="text-white/60 hover:text-white p-2 -ml-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 className="text-xl font-bold flex-1">Custom Prompts</h1>
          <button
            onClick={() => setAdding(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-xl font-semibold text-sm hover:bg-purple-500 transition-colors"
          >
            + Add
          </button>
        </div>
      </div>

      <div className="flex-1 px-6 py-6 max-w-lg mx-auto w-full overflow-y-auto">

        {/* Add prompt form */}
        <AnimatePresence>
          {adding && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-purple-600/20 border border-purple-500/40 rounded-3xl p-4 mb-4"
            >
              <div className="text-sm text-white/60 mb-3">Write a prompt that's fun to answer with a partner:</div>
              <input
                type="text"
                value={newPrompt}
                onChange={(e) => setNewPrompt(e.target.value)}
                placeholder="e.g. Something Andrew would buy"
                maxLength={100}
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false); }}
                className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-purple-500 text-base mb-3"
              />
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setAdding(false)}>Cancel</Button>
                <Button variant="primary" size="sm" disabled={!newPrompt.trim()} onClick={handleAdd}>
                  Add Prompt
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {customPrompts.length === 0 && !adding ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="text-6xl mb-4">✏️</div>
            <div className="text-white/50 text-lg font-semibold">No custom prompts yet</div>
            <div className="text-white/30 text-sm mt-2 mb-6 max-w-xs">
              Add prompts personalized to your group — inside jokes, shared memories, or custom categories.
            </div>
            <Button variant="primary" size="md" onClick={() => setAdding(true)}>
              + Add Your First Prompt
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <div className="text-xs uppercase tracking-widest text-white/40 mb-2">
              {customPrompts.length} custom {customPrompts.length === 1 ? 'prompt' : 'prompts'}
            </div>
            <AnimatePresence>
              {customPrompts.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-4"
                >
                  <span className="text-purple-400 text-lg shrink-0">❝</span>
                  <span className="flex-1 text-white font-medium text-sm leading-snug">{p.text}</span>
                  <button
                    onClick={() => removeCustomPrompt(p.id)}
                    className="text-white/30 hover:text-red-400 transition-colors p-1 shrink-0"
                    aria-label="Remove prompt"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
                    </svg>
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {customPrompts.length > 0 && (
        <div className="px-6 pb-6 safe-bottom max-w-lg mx-auto w-full">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-sm text-amber-300/80">
            💡 Enable "Mix in custom prompts" in Game Setup to include these during play.
          </div>
        </div>
      )}
    </div>
  );
}
