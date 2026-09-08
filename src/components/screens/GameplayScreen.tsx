import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import { Button } from '../ui/Button';
import { Scoreboard } from '../ui/Scoreboard';
import { sounds, vibrate } from '../../utils/audio';
import { CATEGORY_EMOJIS, CATEGORY_LABELS } from '../../types';

type Phase = 'reveal-team' | 'prompt' | 'countdown' | 'judging' | 'secret-a' | 'pass-phone' | 'secret-b' | 'reveal-answers';

export function GameplayScreen() {
  const {
    game, currentPrompt, submitResult, skipPrompt,
    resumeGame, endGame, editScore, restartRound,
    setShowHostMenu, showHostMenu, appSettings,
  } = useGameStore();

  const [phase, setPhase] = useState<Phase>('reveal-team');
  const [countdown, setCountdown] = useState<number>(3);
  const [lastResult, setLastResult] = useState<'match' | 'no-match' | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [timerLeft, setTimerLeft] = useState<number | null>(null);
  const [timerActive, setTimerActive] = useState(false);
  const [secretA, setSecretA] = useState('');
  const [secretB, setSecretB] = useState('');
  const [showScoreboard, setShowScoreboard] = useState(false);
  const [showEditScore, setShowEditScore] = useState(false);
  const [editScores, setEditScores] = useState<Record<string, number>>({});
  const [banner, setBanner] = useState<string | null>(null);

  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prompt = currentPrompt();

  const sfx = useCallback((fn: () => void) => {
    if (appSettings.soundEffects) fn();
  }, [appSettings.soundEffects]);

  const buzz = useCallback((pattern: number | number[]) => {
    if (appSettings.vibration) vibrate(pattern);
  }, [appSettings.vibration]);

  // Reset phase when the active team changes
  useEffect(() => {
    setPhase('reveal-team');
    setLastResult(null);
    setShowResult(false);
    setSecretA('');
    setSecretB('');
    setTimerLeft(null);
    setTimerActive(false);
  }, [game?.currentTeamIndex, game?.currentRound]);

  // Detect perfect round (all teams matched) and comeback
  useEffect(() => {
    if (!game || game.currentTeamIndex !== 0 || game.currentRound <= 1) return;
    const prevRound = game.currentRound - 1;
    const roundResults = game.rounds.filter((r) => r.roundNumber === prevRound);
    if (roundResults.length === game.teams.length) {
      const allMatched = roundResults.every((r) => r.matched);
      if (allMatched) {
        setBanner('🎯 PERFECT ROUND!');
        setTimeout(() => setBanner(null), 3000);
        return;
      }
    }
    // Comeback: last-place team goes to first
    if (game.teams.length >= 3) {
      const sorted = [...game.teams].sort((a, b) => b.score - a.score);
      const leader = game.teams[game.currentTeamIndex];
      const isFirst = leader.id === sorted[0].id;
      const wasLast = sorted[sorted.length - 1].id === leader.id;
      if (isFirst && wasLast && leader.score > 0) {
        setBanner('🔄 WHAT A COMEBACK!');
        setTimeout(() => setBanner(null), 3000);
      }
    }
  }, [game?.currentRound]);

  const startCountdown = useCallback(() => {
    setPhase('countdown');
    setCountdown(3);
    sfx(() => sounds.countdown(3));
    buzz([50]);

    let count = 3;
    countdownRef.current = setInterval(() => {
      count--;
      if (count >= 0) {
        setCountdown(count);
        if (count > 0) sfx(() => sounds.countdown(count));
        else {
          sfx(() => sounds.countdown(0));
          buzz([100, 50, 100]);
          clearInterval(countdownRef.current!);
          setPhase('judging');
          const timerSecs = game?.settings.timerSeconds;
          if (timerSecs) {
            setTimerLeft(timerSecs);
            setTimerActive(true);
          }
        }
      }
    }, 1000);
  }, [sfx, buzz, game?.settings.timerSeconds]);

  // Timer countdown
  useEffect(() => {
    if (!timerActive || timerLeft === null) return;
    timerRef.current = setInterval(() => {
      setTimerLeft((t) => {
        if (t === null || t <= 1) {
          clearInterval(timerRef.current!);
          setTimerActive(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [timerActive]);

  useEffect(() => {
    return () => {
      clearInterval(countdownRef.current!);
      clearInterval(timerRef.current!);
    };
  }, []);

  const handleResult = useCallback((matched: boolean) => {
    clearInterval(timerRef.current!);
    setTimerActive(false);
    setLastResult(matched ? 'match' : 'no-match');
    setShowResult(true);

    const team = game?.teams[game?.currentTeamIndex ?? 0];

    if (matched) {
      sfx(() => sounds.match());
      buzz([50, 30, 100]);
      if (team && team.streak >= 2) sfx(() => sounds.streak());
    } else {
      sfx(() => sounds.noMatch());
      buzz([30]);
    }

    setTimeout(() => {
      setShowResult(false);
      submitResult(matched);
    }, 1800);
  }, [game, sfx, buzz, submitResult]);

  const handleSkip = () => {
    skipPrompt();
    sfx(() => sounds.click());
    setPhase('reveal-team');
  };

  if (!game) return null;

  const team = game.teams[game.currentTeamIndex];
  const totalRounds = game.settings.numberOfRounds;

  // Points that will be earned for a match
  const matchPoints =
    game.settings.scoringMode === 'standard' ? 1 :
    game.settings.scoringMode === 'double' ? 2 :
    team.streak + 1;

  return (
    <div className="bg-game min-h-dvh flex flex-col select-none">
      {/* Background gradient accent */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-purple-900/20 to-transparent" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-4 safe-top">
        <button
          onClick={() => setShowHostMenu(true)}
          className="p-2.5 rounded-xl bg-white/10 text-white/70 hover:text-white hover:bg-white/15 transition-colors"
          aria-label="Host Menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round"/>
          </svg>
        </button>

        <div className="text-center">
          <div className="text-xs text-white/40 uppercase tracking-wider">Round</div>
          <div className="text-lg font-black text-white">{game.currentRound} / {totalRounds}</div>
        </div>

        <button
          onClick={() => setShowScoreboard(!showScoreboard)}
          className="p-2.5 rounded-xl bg-white/10 text-white/70 hover:text-white hover:bg-white/15 transition-colors"
          aria-label="Scoreboard"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Progress bar */}
      <div className="px-5 mt-2 relative z-10">
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
            initial={false}
            animate={{ width: `${((game.currentRound - 1) / totalRounds) * 100}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
        {/* Team dots */}
        <div className="flex gap-1 mt-1.5">
          {game.teams.map((t, i) => (
            <div
              key={t.id}
              className={`flex-1 h-1 rounded-full transition-all duration-300 ${
                i === game.currentTeamIndex
                  ? 'bg-purple-400'
                  : 'bg-white/15'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Event banner */}
      <AnimatePresence>
        {banner && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.95 }}
            className="mx-5 mt-3 bg-gradient-to-r from-amber-600/30 to-orange-600/30 border border-amber-500/40 rounded-2xl py-3 px-4 text-center font-black text-amber-300 text-base z-10"
          >
            {banner}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main game area */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-4 relative z-10">
        <AnimatePresence mode="wait">

          {/* ── REVEAL TEAM ──────────────────────────────────────────── */}
          {phase === 'reveal-team' && (
            <motion.div
              key="reveal-team"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center gap-7 w-full max-w-sm"
            >
              <div className="text-center">
                <p className="text-white/50 text-sm uppercase tracking-widest mb-3">Up next</p>
                <div className="text-4xl font-black text-white mb-2">{team.name}</div>
                <div className="flex items-center justify-center gap-3 text-sm">
                  <span className="text-white/40">{team.score} pts</span>
                  {team.streak >= 2 && (
                    <span className="bg-orange-500/20 text-orange-300 px-3 py-1 rounded-full font-bold streak-badge">
                      🔥 {team.streak} streak
                    </span>
                  )}
                </div>
              </div>

              <motion.div
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="w-28 h-28 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-5xl font-black text-white shadow-2xl glow-purple"
              >
                {team.name.charAt(0).toUpperCase()}
              </motion.div>

              <Button variant="primary" size="xl" fullWidth onClick={() => {
                setPhase('prompt');
                sfx(() => sounds.transition());
              }}>
                See Prompt →
              </Button>
            </motion.div>
          )}

          {/* ── SHOW PROMPT ──────────────────────────────────────────── */}
          {phase === 'prompt' && (
            <motion.div
              key="prompt"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="flex flex-col items-center gap-7 w-full max-w-sm"
            >
              <div className="text-center">
                <p className="text-white/40 text-sm font-semibold">{team.name}</p>
              </div>

              {/* Prompt card with category badge */}
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                className="w-full bg-gradient-to-br from-purple-600/20 to-pink-600/10 border border-purple-500/30 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden"
              >
                {/* Subtle background glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-3xl" />

                {/* Category badge */}
                {prompt && (
                  <div className="inline-flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1 text-xs text-white/60 font-medium mb-5">
                    <span>{CATEGORY_EMOJIS[prompt.category]}</span>
                    <span>{CATEGORY_LABELS[prompt.category]}</span>
                  </div>
                )}

                <div className="text-white font-bold leading-tight prompt-text relative">
                  {prompt?.text}
                </div>
              </motion.div>

              <p className="text-white/40 text-sm text-center">
                Think of your answer silently — don't say it yet!
              </p>

              <div className="w-full flex gap-3">
                {!game.settings.secretAnswerMode ? (
                  <Button variant="primary" size="xl" fullWidth onClick={startCountdown}>
                    Start Countdown
                  </Button>
                ) : (
                  <Button variant="primary" size="xl" fullWidth onClick={() => setPhase('secret-a')}>
                    Partner A: Enter Answer
                  </Button>
                )}
                <button
                  onClick={handleSkip}
                  className="px-4 text-white/40 hover:text-white/60 text-sm font-semibold rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/10 whitespace-nowrap"
                  aria-label="Skip this prompt"
                >
                  Skip
                </button>
              </div>
            </motion.div>
          )}

          {/* ── COUNTDOWN ────────────────────────────────────────────── */}
          {phase === 'countdown' && (
            <motion.div
              key="countdown"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-6"
            >
              <p className="text-white/60 text-lg font-semibold">{team.name}</p>

              {countdown > 0 ? (
                <motion.div
                  key={`count-${countdown}`}
                  initial={{ scale: 0.3, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.6, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 14 }}
                  className="countdown-number gradient-text"
                >
                  {countdown}
                </motion.div>
              ) : (
                <motion.div
                  key="go"
                  initial={{ scale: 0.2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 12 }}
                  className="font-black text-white"
                  style={{
                    fontSize: 'clamp(70px, 22vw, 160px)',
                    textShadow: '0 0 80px rgba(167,139,250,0.9)',
                    lineHeight: 1,
                  }}
                >
                  GO!
                </motion.div>
              )}

              <p className="text-white/30 text-sm mt-2">
                {countdown > 0 ? 'Get ready…' : 'Say your answer now!'}
              </p>
            </motion.div>
          )}

          {/* ── JUDGING ──────────────────────────────────────────────── */}
          {phase === 'judging' && !showResult && (
            <motion.div
              key="judging"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center gap-5 w-full max-w-sm"
            >
              <div className="text-center">
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  className="text-5xl mb-3"
                >
                  🎤
                </motion.div>
                <p className="text-3xl font-black text-white">REVEAL!</p>
                <p className="text-white/50 text-sm mt-1">Both partners say their answers</p>
              </div>

              {/* Timer */}
              {timerLeft !== null && (
                <motion.div
                  animate={timerLeft <= 5 ? { scale: [1, 1.08, 1] } : {}}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className={`text-5xl font-black tabular-nums ${timerLeft <= 5 ? 'text-red-400' : 'text-white'}`}
                >
                  {timerLeft}
                </motion.div>
              )}

              {/* Prompt reminder */}
              <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                {prompt && (
                  <div className="text-xs text-white/30 mb-1">
                    {CATEGORY_EMOJIS[prompt.category]} {CATEGORY_LABELS[prompt.category]}
                  </div>
                )}
                <div className="text-white font-semibold">{prompt?.text}</div>
              </div>

              {/* Streak indicator */}
              {team.streak >= 2 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="bg-orange-500/20 border border-orange-500/40 text-orange-300 px-4 py-2 rounded-full font-bold text-sm"
                >
                  🔥 {team.streak} match streak! Match for +{matchPoints} pts
                </motion.div>
              )}

              {/* Judge buttons */}
              <div className="w-full space-y-3">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleResult(true)}
                  className="w-full py-6 bg-gradient-to-r from-emerald-600 to-green-500 text-white font-black text-2xl rounded-3xl shadow-2xl shadow-emerald-900/40 flex items-center justify-center gap-3 glow-green"
                  aria-label="It's a match"
                >
                  <span>✓</span>
                  <span>MATCH</span>
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleResult(false)}
                  className="w-full py-6 bg-gradient-to-r from-red-700 to-rose-600 text-white font-black text-2xl rounded-3xl shadow-2xl shadow-red-900/40 flex items-center justify-center gap-3 glow-red"
                  aria-label="No match"
                >
                  <span>✕</span>
                  <span>NO MATCH</span>
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ── RESULT OVERLAY ───────────────────────────────────────── */}
          {showResult && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.2 }}
              transition={{ type: 'spring', stiffness: 300, damping: 18 }}
              className="flex flex-col items-center gap-4 text-center"
            >
              {lastResult === 'match' ? (
                <>
                  <motion.div
                    animate={{ rotate: [-8, 8, -4, 4, 0], scale: [1, 1.15, 1] }}
                    transition={{ duration: 0.6 }}
                    className="text-8xl"
                  >
                    🎉
                  </motion.div>
                  <div className="text-4xl font-black text-emerald-400">IT'S A MATCH!</div>
                  {game.settings.scoringMode === 'streak' && team.streak >= 1 && (
                    <div className="text-orange-300 font-bold text-lg">🔥 Streak bonus!</div>
                  )}
                  <div className="text-7xl font-black gradient-text-gold">+{matchPoints}</div>
                </>
              ) : (
                <>
                  <div className="text-8xl">😬</div>
                  <div className="text-4xl font-black text-red-400">NO MATCH</div>
                  <div className="text-white/50 text-lg">Better luck next round!</div>
                </>
              )}
            </motion.div>
          )}

          {/* ── SECRET MODE — Partner A ──────────────────────────────── */}
          {phase === 'secret-a' && (
            <motion.div
              key="secret-a"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              className="flex flex-col items-center gap-6 w-full max-w-sm"
            >
              <div className="text-center">
                <div className="text-4xl mb-2">🙈</div>
                <p className="text-2xl font-bold text-white">Partner A</p>
                <p className="text-white/50 text-sm mt-1">Type your answer — Partner B won't see it</p>
              </div>

              <div className="w-full bg-purple-600/10 border border-purple-500/30 rounded-3xl p-5 text-center">
                {prompt && (
                  <div className="text-xs text-white/30 mb-2">{CATEGORY_EMOJIS[prompt.category]} {CATEGORY_LABELS[prompt.category]}</div>
                )}
                <div className="text-white font-bold">{prompt?.text}</div>
              </div>

              <input
                type="text"
                value={secretA}
                onChange={(e) => setSecretA(e.target.value)}
                placeholder="Type your answer…"
                autoFocus
                autoComplete="off"
                autoCorrect="off"
                className="w-full bg-white/10 border border-white/20 rounded-2xl px-5 py-4 text-white font-semibold placeholder-white/30 focus:outline-none focus:border-purple-500 text-center"
                style={{ fontSize: 18 }}
              />

              <Button variant="primary" size="lg" fullWidth disabled={!secretA.trim()} onClick={() => setPhase('pass-phone')}>
                Done →
              </Button>
            </motion.div>
          )}

          {/* ── PASS THE PHONE ───────────────────────────────────────── */}
          {phase === 'pass-phone' && (
            <motion.div
              key="pass-phone"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center gap-8 w-full max-w-sm"
            >
              <motion.div
                animate={{ x: [0, 18, -18, 8, -8, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="text-8xl"
              >
                📱
              </motion.div>
              <div className="text-center">
                <p className="text-3xl font-black text-white">PASS THE PHONE</p>
                <p className="text-white/50 mt-2 text-base">Give the phone to Partner B</p>
              </div>
              <Button variant="secondary" size="lg" fullWidth onClick={() => setPhase('secret-b')}>
                I'm Ready
              </Button>
            </motion.div>
          )}

          {/* ── SECRET MODE — Partner B ──────────────────────────────── */}
          {phase === 'secret-b' && (
            <motion.div
              key="secret-b"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              className="flex flex-col items-center gap-6 w-full max-w-sm"
            >
              <div className="text-center">
                <div className="text-4xl mb-2">🙊</div>
                <p className="text-2xl font-bold text-white">Partner B</p>
                <p className="text-white/50 text-sm mt-1">Now it's your turn</p>
              </div>

              <div className="w-full bg-purple-600/10 border border-purple-500/30 rounded-3xl p-5 text-center">
                {prompt && (
                  <div className="text-xs text-white/30 mb-2">{CATEGORY_EMOJIS[prompt.category]} {CATEGORY_LABELS[prompt.category]}</div>
                )}
                <div className="text-white font-bold">{prompt?.text}</div>
              </div>

              <input
                type="text"
                value={secretB}
                onChange={(e) => setSecretB(e.target.value)}
                placeholder="Type your answer…"
                autoFocus
                autoComplete="off"
                autoCorrect="off"
                className="w-full bg-white/10 border border-white/20 rounded-2xl px-5 py-4 text-white font-semibold placeholder-white/30 focus:outline-none focus:border-purple-500 text-center"
                style={{ fontSize: 18 }}
              />

              <Button variant="primary" size="lg" fullWidth disabled={!secretB.trim()} onClick={() => setPhase('reveal-answers')}>
                Reveal Both →
              </Button>
            </motion.div>
          )}

          {/* ── REVEAL BOTH ANSWERS (secret mode) ────────────────────── */}
          {phase === 'reveal-answers' && !showResult && (
            <motion.div
              key="reveal-answers"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-6 w-full max-w-sm"
            >
              <p className="text-2xl font-black text-white">The Answers Are…</p>

              <div className="w-full grid grid-cols-2 gap-3">
                {[
                  { label: 'Partner A', answer: secretA },
                  { label: 'Partner B', answer: secretB },
                ].map((p, i) => (
                  <motion.div
                    key={p.label}
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: i * 0.15 }}
                    className="bg-purple-600/20 border border-purple-500/30 rounded-2xl p-4 text-center"
                  >
                    <div className="text-white/40 text-xs mb-2">{p.label}</div>
                    <div className="text-white font-bold text-lg leading-tight">"{p.answer}"</div>
                  </motion.div>
                ))}
              </div>

              <div className="w-full space-y-3">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleResult(true)}
                  className="w-full py-6 bg-gradient-to-r from-emerald-600 to-green-500 text-white font-black text-2xl rounded-3xl shadow-2xl glow-green"
                >
                  ✓ MATCH
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleResult(false)}
                  className="w-full py-6 bg-gradient-to-r from-red-700 to-rose-600 text-white font-black text-2xl rounded-3xl shadow-2xl glow-red"
                >
                  ✕ NO MATCH
                </motion.button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ── HOST MENU ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showHostMenu && (
          <HostMenu
            onResume={resumeGame}
            onEndGame={endGame}
            onRestartRound={() => { restartRound(); setPhase('reveal-team'); }}
            onEditScores={() => {
              const scores: Record<string, number> = {};
              game.teams.forEach((t) => { scores[t.id] = t.score; });
              setEditScores(scores);
              setShowEditScore(true);
            }}
            onSkip={handleSkip}
          />
        )}
      </AnimatePresence>

      {/* ── EDIT SCORES SHEET ──────────────────────────────────────────── */}
      <AnimatePresence>
        {showEditScore && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center"
            onClick={() => setShowEditScore(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#1a1a2e] border-t border-white/10 rounded-t-3xl p-6 w-full max-w-lg safe-bottom"
            >
              <h3 className="text-xl font-bold text-white mb-5">Edit Scores</h3>
              <div className="space-y-4 mb-6">
                {game.teams.map((t) => (
                  <div key={t.id} className="flex items-center justify-between gap-4">
                    <span className="text-white font-semibold truncate flex-1">{t.name}</span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setEditScores((s) => ({ ...s, [t.id]: Math.max(0, (s[t.id] ?? t.score) - 1) }))}
                        className="w-11 h-11 rounded-full bg-white/10 text-white text-xl font-bold hover:bg-white/20 transition-colors"
                        aria-label="Decrease score"
                      >
                        −
                      </button>
                      <span className="w-10 text-center text-2xl font-black text-white tabular-nums">
                        {editScores[t.id] ?? t.score}
                      </span>
                      <button
                        onClick={() => setEditScores((s) => ({ ...s, [t.id]: (s[t.id] ?? t.score) + 1 }))}
                        className="w-11 h-11 rounded-full bg-white/10 text-white text-xl font-bold hover:bg-white/20 transition-colors"
                        aria-label="Increase score"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <Button variant="ghost" fullWidth onClick={() => setShowEditScore(false)}>Cancel</Button>
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => {
                    Object.entries(editScores).forEach(([id, score]) => editScore(id, score));
                    setShowEditScore(false);
                    setShowHostMenu(false);
                  }}
                >
                  Save Scores
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SCOREBOARD OVERLAY ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showScoreboard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-40 flex items-end justify-center"
            onClick={() => setShowScoreboard(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#1a1a2e] border-t border-white/10 rounded-t-3xl p-6 w-full max-w-lg safe-bottom"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-bold text-white">Leaderboard</h3>
                <button onClick={() => setShowScoreboard(false)} className="text-white/40 hover:text-white text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10">✕</button>
              </div>
              <Scoreboard teams={game.teams} activeTeamId={team.id} />
              <p className="text-white/30 text-xs text-center mt-4">Tap anywhere to close</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function HostMenu({
  onResume, onEndGame, onRestartRound, onEditScores, onSkip,
}: {
  onResume: () => void;
  onEndGame: () => void;
  onRestartRound: () => void;
  onEditScores: () => void;
  onSkip: () => void;
}) {
  const [confirmEnd, setConfirmEnd] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center"
      onClick={onResume}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#1a1a2e] border-t border-white/10 rounded-t-3xl p-6 w-full max-w-lg safe-bottom"
      >
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-5" />
        <h3 className="text-sm font-semibold text-white/40 text-center uppercase tracking-widest mb-4">Host Menu</h3>

        {confirmEnd ? (
          <div className="space-y-4">
            <p className="text-white text-center font-bold text-lg">End the game?</p>
            <p className="text-white/50 text-center text-sm">Current progress will not be saved.</p>
            <div className="flex gap-3 mt-4">
              <Button variant="ghost" fullWidth onClick={() => setConfirmEnd(false)}>Cancel</Button>
              <Button variant="danger" fullWidth onClick={onEndGame}>Yes, End Game</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {[
              { label: '▶  Resume Game', action: onResume, variant: 'primary' as const },
              { label: '⏩  Skip Prompt', action: onSkip, variant: 'secondary' as const },
              { label: '↩  Restart Round', action: onRestartRound, variant: 'secondary' as const },
              { label: '✏️  Edit Scores', action: onEditScores, variant: 'secondary' as const },
              { label: '✕  End Game', action: () => setConfirmEnd(true), variant: 'danger' as const },
            ].map((item) => (
              <Button key={item.label} variant={item.variant} size="md" fullWidth onClick={item.action}>
                {item.label}
              </Button>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
