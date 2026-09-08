import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import { Button } from '../ui/Button';
import type { Category, Difficulty, ScoringMode } from '../../types';
import { CATEGORY_LABELS, CATEGORY_EMOJIS, DIFFICULTY_LABELS } from '../../types';

const ALL_CATEGORIES: Category[] = [
  'general', 'food', 'movies-tv', 'sports', 'music',
  'gaming', 'everyday', 'funny', 'random', 'family',
  'nostalgia', 'hard-trivia',
];
const ALL_DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard', 'chaos'];

export function SetupScreen() {
  const { setScreen, setupSettings, teamNames, updateSetupSettings, updateTeamName, startGame } = useGameStore();
  const [tab, setTab] = useState<'teams' | 'rules' | 'prompts'>('teams');

  const handleStart = () => {
    if (teamNames.every((n) => !n.trim())) return;
    startGame();
  };

  const roundOptions = [5, 10, 15, 20];
  const timerOptions: Array<{ label: string; value: number | null }> = [
    { label: 'None', value: null },
    { label: '10s', value: 10 },
    { label: '15s', value: 15 },
    { label: '20s', value: 20 },
    { label: '30s', value: 30 },
  ];

  const toggleCategory = (cat: Category) => {
    const cats = setupSettings.categories;
    const next = cats.includes(cat)
      ? cats.length > 1 ? cats.filter((c) => c !== cat) : cats
      : [...cats, cat];
    updateSetupSettings({ categories: next });
  };

  const toggleDifficulty = (d: Difficulty) => {
    const diffs = setupSettings.difficulties;
    const next = diffs.includes(d)
      ? diffs.length > 1 ? diffs.filter((x) => x !== d) : diffs
      : [...diffs, d];
    updateSetupSettings({ difficulties: next });
  };

  const difficultyColors: Record<Difficulty, string> = {
    easy: 'from-emerald-600 to-green-600',
    medium: 'from-yellow-600 to-amber-600',
    hard: 'from-orange-600 to-red-600',
    chaos: 'from-pink-600 to-rose-600',
  };

  const scoringOptions: Array<{ value: ScoringMode; label: string; desc: string }> = [
    { value: 'standard', label: 'Standard', desc: 'Match = +1 point' },
    { value: 'double', label: 'Double', desc: 'Match = +2 points' },
    { value: 'streak', label: 'Streak', desc: 'Consecutive matches earn more' },
  ];

  return (
    <div className="bg-game min-h-dvh flex flex-col">
      {/* Header */}
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
          <h1 className="text-xl font-bold flex-1">Game Setup</h1>
        </div>
        {/* Tabs */}
        <div className="flex px-6 pb-3 gap-2 max-w-lg mx-auto w-full">
          {(['teams', 'rules', 'prompts'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={[
                'flex-1 py-2 rounded-xl text-sm font-semibold transition-all',
                tab === t
                  ? 'bg-purple-600 text-white'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5',
              ].join(' ')}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 max-w-lg mx-auto w-full space-y-4">
        <AnimatePresence mode="wait">
          {tab === 'teams' && (
            <motion.div
              key="teams"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              {/* Number of teams */}
              <Section title="Number of Teams">
                <div className="flex gap-2 flex-wrap">
                  {[2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <ChipButton
                      key={n}
                      active={setupSettings.numberOfTeams === n}
                      onClick={() => updateSetupSettings({ numberOfTeams: n })}
                    >
                      {n}
                    </ChipButton>
                  ))}
                </div>
              </Section>

              {/* Team names */}
              <Section title="Team Names">
                <div className="space-y-3">
                  {Array.from({ length: setupSettings.numberOfTeams }, (_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-sm font-bold text-purple-300 shrink-0">
                        {i + 1}
                      </div>
                      <input
                        type="text"
                        value={teamNames[i] || ''}
                        onChange={(e) => updateTeamName(i, e.target.value)}
                        placeholder={`Team ${i + 1}`}
                        maxLength={20}
                        className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 font-semibold focus:outline-none focus:border-purple-500 focus:bg-white/15 transition-all text-base"
                      />
                    </div>
                  ))}
                </div>
              </Section>
            </motion.div>
          )}

          {tab === 'rules' && (
            <motion.div
              key="rules"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              {/* Rounds */}
              <Section title="Number of Rounds">
                <div className="flex gap-2 flex-wrap">
                  {roundOptions.map((n) => (
                    <ChipButton
                      key={n}
                      active={setupSettings.numberOfRounds === n}
                      onClick={() => updateSetupSettings({ numberOfRounds: n })}
                    >
                      {n}
                    </ChipButton>
                  ))}
                </div>
              </Section>

              {/* Timer */}
              <Section title="Timer per Team">
                <div className="flex gap-2 flex-wrap">
                  {timerOptions.map((opt) => (
                    <ChipButton
                      key={opt.label}
                      active={setupSettings.timerSeconds === opt.value}
                      onClick={() => updateSetupSettings({ timerSeconds: opt.value })}
                    >
                      {opt.label}
                    </ChipButton>
                  ))}
                </div>
              </Section>

              {/* Scoring mode */}
              <Section title="Scoring Mode">
                <div className="space-y-2">
                  {scoringOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => updateSetupSettings({ scoringMode: opt.value })}
                      className={[
                        'w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left',
                        setupSettings.scoringMode === opt.value
                          ? 'bg-purple-600/20 border-purple-500/60 text-white'
                          : 'bg-white/5 border-white/10 text-white/70 hover:border-white/20',
                      ].join(' ')}
                    >
                      <div>
                        <div className="font-semibold">{opt.label}</div>
                        <div className="text-sm text-white/50">{opt.desc}</div>
                      </div>
                      {setupSettings.scoringMode === opt.value && (
                        <span className="text-purple-400 text-xl">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </Section>

              {/* Secret Answer Mode */}
              <Section title="Secret Answer Mode">
                <button
                  onClick={() => updateSetupSettings({ secretAnswerMode: !setupSettings.secretAnswerMode })}
                  className={[
                    'w-full flex items-center justify-between p-4 rounded-2xl border transition-all',
                    setupSettings.secretAnswerMode
                      ? 'bg-purple-600/20 border-purple-500/60'
                      : 'bg-white/5 border-white/10',
                  ].join(' ')}
                >
                  <div className="text-left">
                    <div className="font-semibold text-white">Type Answers Secretly</div>
                    <div className="text-sm text-white/50">Partners type instead of speaking — answers revealed simultaneously</div>
                  </div>
                  <div className={[
                    'w-12 h-6 rounded-full transition-all relative shrink-0',
                    setupSettings.secretAnswerMode ? 'bg-purple-600' : 'bg-white/20',
                  ].join(' ')}>
                    <div className={[
                      'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all',
                      setupSettings.secretAnswerMode ? 'left-6' : 'left-0.5',
                    ].join(' ')} />
                  </div>
                </button>
              </Section>
            </motion.div>
          )}

          {tab === 'prompts' && (
            <motion.div
              key="prompts"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              {/* Category packs */}
              <Section title="Categories">
                <div className="grid grid-cols-2 gap-2">
                  {ALL_CATEGORIES.map((cat) => {
                    const active = setupSettings.categories.includes(cat);
                    return (
                      <button
                        key={cat}
                        onClick={() => toggleCategory(cat)}
                        className={[
                          'flex items-center gap-2 p-3 rounded-2xl border transition-all text-left',
                          active
                            ? 'bg-purple-600/25 border-purple-500/60 text-white'
                            : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20',
                        ].join(' ')}
                      >
                        <span className="text-xl">{CATEGORY_EMOJIS[cat]}</span>
                        <span className="text-sm font-semibold">{CATEGORY_LABELS[cat]}</span>
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => updateSetupSettings({ categories: ALL_CATEGORIES })}
                  className="text-purple-400 text-sm hover:text-purple-300 transition-colors mt-2"
                >
                  Select All
                </button>
              </Section>

              {/* Difficulty */}
              <Section title="Difficulty">
                <div className="grid grid-cols-2 gap-2">
                  {ALL_DIFFICULTIES.map((d) => {
                    const active = setupSettings.difficulties.includes(d);
                    return (
                      <button
                        key={d}
                        onClick={() => toggleDifficulty(d)}
                        className={[
                          'p-4 rounded-2xl border transition-all font-bold',
                          active
                            ? `bg-gradient-to-br ${difficultyColors[d]} text-white border-transparent shadow-lg`
                            : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20',
                        ].join(' ')}
                      >
                        {DIFFICULTY_LABELS[d]}
                      </button>
                    );
                  })}
                </div>
              </Section>

              {/* Custom prompts */}
              <Section title="Custom Prompts">
                <div className="space-y-2">
                  <ToggleRow
                    label="Mix in custom prompts"
                    desc="Include your custom prompts with built-in ones"
                    value={setupSettings.mixCustomPrompts && !setupSettings.customPromptsOnly}
                    onChange={(v) => updateSetupSettings({ mixCustomPrompts: v, customPromptsOnly: false })}
                  />
                  <ToggleRow
                    label="Custom prompts only"
                    desc="Only use your custom prompts"
                    value={setupSettings.customPromptsOnly}
                    onChange={(v) => updateSetupSettings({ customPromptsOnly: v, mixCustomPrompts: !v })}
                  />
                </div>
                <button
                  onClick={() => setScreen('custom-prompts')}
                  className="text-purple-400 text-sm hover:text-purple-300 transition-colors mt-2"
                >
                  Manage custom prompts →
                </button>
              </Section>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="px-6 pb-6 safe-bottom max-w-lg mx-auto w-full pt-2 border-t border-white/10 bg-[#0f0f1a]/80 backdrop-blur">
        <Button variant="primary" size="xl" fullWidth onClick={handleStart}>
          Start Game
        </Button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-4">
      <h3 className="text-xs uppercase tracking-widest text-white/40 font-semibold mb-3">{title}</h3>
      {children}
    </div>
  );
}

function ChipButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={[
        'px-5 py-2 rounded-full font-semibold text-sm border transition-all',
        active
          ? 'bg-purple-600 text-white border-purple-500'
          : 'bg-white/10 text-white/70 border-white/20 hover:border-white/40',
      ].join(' ')}
    >
      {children}
    </motion.button>
  );
}

function ToggleRow({
  label,
  desc,
  value,
  onChange,
}: {
  label: string;
  desc: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={[
        'w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left',
        value ? 'bg-purple-600/20 border-purple-500/60' : 'bg-white/5 border-white/10',
      ].join(' ')}
    >
      <div>
        <div className="font-semibold text-white text-sm">{label}</div>
        <div className="text-xs text-white/50">{desc}</div>
      </div>
      <div className={['w-11 h-6 rounded-full transition-all relative shrink-0', value ? 'bg-purple-600' : 'bg-white/20'].join(' ')}>
        <div className={['absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all', value ? 'left-5' : 'left-0.5'].join(' ')} />
      </div>
    </button>
  );
}
