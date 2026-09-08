import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import { Button } from '../ui/Button';
import { Scoreboard } from '../ui/Scoreboard';
import { sounds, vibrate } from '../../utils/audio';

type Phase = 'reveal-team' | 'prompt' | 'countdown' | 'judging' | 'secret-a' | 'pass-phone' | 'secret-b' | 'reveal-answers';

export function GameplayScreen() {
  const { game, currentPrompt, submitResult, skipPrompt, resumeGame, endGame, editScore, restartRound, setShowHostMenu, showHostMenu, appSettings } = useGameStore();

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
  const [specialEvent, setSpecialEvent] = useState<string | null>(null);

  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prompt = currentPrompt();

  const sfx = useCallback((fn: () => void) => {
    if (appSettings.soundEffects) fn();
  }, [appSettings.soundEffects]);

  const buzz = useCallback((pattern: number | number[]) => {
    if (appSettings.vibration) vibrate(pattern);
  }, [appSettings.vibration]);

  // Reset phase on team change
  useEffect(() => {
    setPhase('reveal-team');
    setLastResult(null);
    setShowResult(false);
    setSecretA('');
    setSecretB('');
    setTimerLeft(null);
    setTimerActive(false);
  }, [game?.currentTeamIndex, game?.currentRound]);

  // Check for special events occasionally
  useEffect(() => {
    if (game && Math.random() < 0.08 && game.currentRound > 1) {
      const events = ['🎯 PRECISION ROUND', '🔥 HOT STREAK ROUND'];
      setSpecialEvent(events[Math.floor(Math.random() * events.length)]);
      setTimeout(() => setSpecialEvent(null), 3000);
    }
  }, [game?.currentRound, game?.currentTeamIndex]);

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
          // Start timer if enabled
          const timerSecs = game?.settings.timerSeconds;
          if (timerSecs) {
            setTimerLeft(timerSecs);
            setTimerActive(true);
          }
        }
      }
    }, 1000);
  }, [sfx, buzz, game?.settings.timerSeconds]);

  // Timer countdown during judging
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

    if (matched) {
      sfx(() => sounds.match());
      buzz([50, 30, 100]);
    } else {
      sfx(() => sounds.noMatch());
      buzz([30]);
    }

    // Check for streak
    const team = game?.teams[game?.currentTeamIndex ?? 0];
    if (matched && team && team.streak >= 2) {
      sfx(() => sounds.streak());
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

  return (
    <div className="bg-game min-h-dvh flex flex-col select-none">
      {/* Background accent */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-purple-900/20 to-transparent" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-4 safe-top">
        <button
          onClick={() => { setShowHostMenu(true); }}
          className="p-2 rounded-xl bg-white/10 text-white/70 hover:text-white hover:bg-white/15 transition-colors"
          aria-label="Host Menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round"/>
          </svg>
        </button>

        {/* Round progress */}
        <div className="text-center">
          <div className="text-xs text-white/40 uppercase tracking-wider">Round</div>
          <div className="text-lg font-black text-white">{game.currentRound} / {totalRounds}</div>
        </div>

        <button
          onClick={() => setShowScoreboard(!showScoreboard)}
          className="p-2 rounded-xl bg-white/10 text-white/70 hover:text-white hover:bg-white/15 transition-colors"
          aria-label="Scoreboard"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Round progress bar */}
      <div className="px-5 mt-2 relative z-10">
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
            initial={false}
            animate={{ width: `${((game.currentRound - 1) / totalRounds) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="flex justify-between mt-1">
          {game.teams.map((t, i) => (
            <div
              key={t.id}
              className={`flex items-center gap-1 text-xs ${i === game.currentTeamIndex ? 'text-white' : 'text-white/30'}`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${i === game.currentTeamIndex ? 'bg-purple-400' : 'bg-white/20'}`} />
            </div>
          ))}
        </div>
      </div>

      {/* Special event banner */}
      <AnimatePresence>
        {specialEvent && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mx-5 mt-3 bg-gradient-to-r from-amber-600/30 to-orange-600/30 border border-amber-500/40 rounded-2xl p-3 text-center font-bold text-amber-300 text-sm z-10"
          >
            {specialEvent}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main game area */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-4 relative z-10">
        <AnimatePresence mode="wait">

          {/* REVEAL TEAM */}
          {phase === 'reveal-team' && (
            <motion.div
              key="reveal-team"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center gap-8 w-full max-w-sm"
            >
              <div className="text-center">
                <p className="text-white/50 text-sm uppercase tracking-widest mb-2">Up next</p>
                <div className="text-4xl font-black text-white mb-1">{team.name}</div>
                <div className="flex items-center justify-center gap-2 text-white/40 text-sm">
                  <span>{team.score} pts</span>
                  {team.streak >= 2 && (
                    <span className="bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded-full">
                      🔥 {team.streak} streak
                    </span>
                  )}
                </div>
              </div>

              {/* Team avatar */}
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-4xl shadow-2xl glow-purple">
                {team.name.charAt(0).toUpperCase()}
              </div>

              <Button
                variant="primary"
                size="xl"
                fullWidth
                onClick={() => {
                  setPhase('prompt');
                  sfx(() => sounds.transition());
                }}
              >
                See Prompt →
              </Button>
            </motion.div>
          )}

          {/* SHOW PROMPT */}
          {phase === 'prompt' && (
            <motion.div
              key="prompt"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="flex flex-col items-center gap-8 w-full max-w-sm"
            >
              <div className="text-center">
                <p className="text-white/40 text-xs uppercase tracking-widest mb-3">{team.name}</p>
                <div className="text-xs text-purple-400 uppercase tracking-widest mb-4">Your Prompt</div>
              </div>

              {/* Prompt card */}
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                className="w-full bg-gradient-to-br from-purple-600/20 to-pink-600/10 border border-purple-500/30 rounded-3xl p-8 text-center shadow-2xl glow-purple"
              >
                <div className="text-white font-bold leading-tight prompt-text">
                  {prompt?.text}
                </div>
              </motion.div>

              <div className="text-center text-white/50 text-sm">
                Both partners think of an answer silently…
              </div>

              <div className="w-full flex gap-3">
                {!game.settings.secretAnswerMode ? (
                  <Button
                    variant="primary"
                    size="xl"
                    fullWidth
                    onClick={startCountdown}
                  >
                    Start Countdown
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="xl"
                    fullWidth
                    onClick={() => setPhase('secret-a')}
                  >
                    Partner A: Enter Answer
                  </Button>
                )}
                <button
                  onClick={handleSkip}
                  className="px-4 py-3 text-white/40 hover:text-white/60 text-sm font-semibold rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/10"
                >
                  Skip
                </button>
              </div>
            </motion.div>
          )}

          {/* COUNTDOWN */}
          {phase === 'countdown' && (
            <motion.div
              key="countdown"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-6"
            >
              <p className="text-white/50 text-lg font-semibold">{team.name}</p>

              {countdown > 0 ? (
                <motion.div
                  key={countdown}
                  initial={{ scale: 0.3, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.5, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                  className="countdown-number gradient-text"
                >
                  {countdown}
                </motion.div>
              ) : (
                <motion.div
                  key="go"
                  initial={{ scale: 0.3, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 12 }}
                  className="text-[clamp(60px,20vw,140px)] font-black text-white"
                  style={{ textShadow: '0 0 60px rgba(167,139,250,0.8)' }}
                >
                  GO!
                </motion.div>
              )}

              <p className="text-white/40 text-sm">
                {countdown > 0 ? 'Get ready…' : 'Say your answer!'}
              </p>
            </motion.div>
          )}

          {/* JUDGING */}
          {phase === 'judging' && !showResult && (
            <motion.div
              key="judging"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center gap-6 w-full max-w-sm"
            >
              <div className="text-center">
                <motion.div
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-5xl mb-3"
                >
                  🎤
                </motion.div>
                <p className="text-2xl font-black text-white">REVEAL!</p>
                <p className="text-white/50 text-sm mt-2">Both partners say their answers</p>
              </div>

              {/* Timer */}
              {timerLeft !== null && (
                <motion.div
                  animate={timerLeft <= 5 ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ duration: 0.5, repeat: timerLeft <= 5 ? Infinity : 0 }}
                  className={[
                    'text-4xl font-black tabular-nums',
                    timerLeft <= 5 ? 'text-red-400' : 'text-white',
                  ].join(' ')}
                >
                  {timerLeft}
                </motion.div>
              )}

              {/* Prompt reminder */}
              <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                <div className="text-white/40 text-xs mb-1">Prompt</div>
                <div className="text-white font-semibold">{prompt?.text}</div>
              </div>

              {/* Judge buttons */}
              <div className="w-full space-y-3">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleResult(true)}
                  className="w-full py-5 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-black text-2xl rounded-3xl shadow-2xl shadow-emerald-900/40 flex items-center justify-center gap-3 glow-green"
                  aria-label="It's a match"
                >
                  <span>✓</span>
                  <span>MATCH</span>
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleResult(false)}
                  className="w-full py-5 bg-gradient-to-r from-red-700 to-rose-700 text-white font-black text-2xl rounded-3xl shadow-2xl shadow-red-900/40 flex items-center justify-center gap-3 glow-red"
                  aria-label="No match"
                >
                  <span>✕</span>
                  <span>NO MATCH</span>
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* RESULT */}
          {showResult && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.2 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="flex flex-col items-center gap-4"
            >
              {lastResult === 'match' ? (
                <>
                  <motion.div
                    animate={{ rotate: [0, -5, 5, 0], scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.5 }}
                    className="text-8xl"
                  >
                    🎉
                  </motion.div>
                  <div className="text-4xl font-black text-emerald-400">IT'S A MATCH!</div>
                  {game.settings.scoringMode === 'streak' && game.teams[game.currentTeamIndex].streak >= 2 && (
                    <div className="text-orange-300 font-bold">🔥 STREAK BONUS!</div>
                  )}
                  <div className="text-6xl font-black gradient-text-gold">+{
                    game.settings.scoringMode === 'standard' ? 1 :
                    game.settings.scoringMode === 'double' ? 2 :
                    game.teams[game.currentTeamIndex].streak + 1
                  }</div>
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

          {/* SECRET MODE - Partner A */}
          {phase === 'secret-a' && (
            <motion.div
              key="secret-a"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              className="flex flex-col items-center gap-6 w-full max-w-sm"
            >
              <div className="text-center">
                <div className="text-3xl mb-2">🙈</div>
                <p className="text-xl font-bold text-white">Partner A</p>
                <p className="text-white/50 text-sm mt-1">Type your answer — Partner B won't see it</p>
              </div>

              <div className="w-full bg-purple-600/10 border border-purple-500/30 rounded-3xl p-6 text-center">
                <div className="text-white/50 text-xs mb-3">Prompt</div>
                <div className="text-white font-bold">{prompt?.text}</div>
              </div>

              <input
                type="text"
                value={secretA}
                onChange={(e) => setSecretA(e.target.value)}
                placeholder="Type your answer…"
                autoFocus
                className="w-full bg-white/10 border border-white/20 rounded-2xl px-5 py-4 text-white text-lg font-semibold placeholder-white/30 focus:outline-none focus:border-purple-500 text-center"
              />

              <Button
                variant="primary"
                size="lg"
                fullWidth
                disabled={!secretA.trim()}
                onClick={() => setPhase('pass-phone')}
              >
                Done →
              </Button>
            </motion.div>
          )}

          {/* PASS PHONE */}
          {phase === 'pass-phone' && (
            <motion.div
              key="pass-phone"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center gap-8 w-full max-w-sm"
            >
              <motion.div
                animate={{ x: [0, 20, -20, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                className="text-7xl"
              >
                📱
              </motion.div>
              <div className="text-center">
                <p className="text-2xl font-black text-white">PASS THE PHONE</p>
                <p className="text-white/50 mt-2">Give the phone to Partner B</p>
              </div>
              <Button
                variant="secondary"
                size="lg"
                fullWidth
                onClick={() => setPhase('secret-b')}
              >
                I'm Ready
              </Button>
            </motion.div>
          )}

          {/* SECRET MODE - Partner B */}
          {phase === 'secret-b' && (
            <motion.div
              key="secret-b"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              className="flex flex-col items-center gap-6 w-full max-w-sm"
            >
              <div className="text-center">
                <div className="text-3xl mb-2">🙈</div>
                <p className="text-xl font-bold text-white">Partner B</p>
                <p className="text-white/50 text-sm mt-1">Now it's your turn</p>
              </div>

              <div className="w-full bg-purple-600/10 border border-purple-500/30 rounded-3xl p-6 text-center">
                <div className="text-white/50 text-xs mb-3">Prompt</div>
                <div className="text-white font-bold">{prompt?.text}</div>
              </div>

              <input
                type="text"
                value={secretB}
                onChange={(e) => setSecretB(e.target.value)}
                placeholder="Type your answer…"
                autoFocus
                className="w-full bg-white/10 border border-white/20 rounded-2xl px-5 py-4 text-white text-lg font-semibold placeholder-white/30 focus:outline-none focus:border-purple-500 text-center"
              />

              <Button
                variant="primary"
                size="lg"
                fullWidth
                disabled={!secretB.trim()}
                onClick={() => setPhase('reveal-answers')}
              >
                Reveal Both →
              </Button>
            </motion.div>
          )}

          {/* REVEAL BOTH ANSWERS */}
          {phase === 'reveal-answers' && !showResult && (
            <motion.div
              key="reveal-answers"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-6 w-full max-w-sm"
            >
              <p className="text-xl font-black text-white">The Answers Are…</p>

              <div className="w-full grid grid-cols-2 gap-3">
                {[{ label: 'Partner A', answer: secretA }, { label: 'Partner B', answer: secretB }].map((p) => (
                  <motion.div
                    key={p.label}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-purple-600/20 border border-purple-500/30 rounded-2xl p-4 text-center"
                  >
                    <div className="text-white/40 text-xs mb-2">{p.label}</div>
                    <div className="text-white font-bold text-lg">"{p.answer}"</div>
                  </motion.div>
                ))}
              </div>

              <div className="w-full space-y-3">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleResult(true)}
                  className="w-full py-5 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-black text-2xl rounded-3xl shadow-2xl glow-green"
                >
                  ✓ MATCH
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleResult(false)}
                  className="w-full py-5 bg-gradient-to-r from-red-700 to-rose-700 text-white font-black text-2xl rounded-3xl shadow-2xl glow-red"
                >
                  ✕ NO MATCH
                </motion.button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Host Menu */}
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

      {/* Edit Scores */}
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
              <h3 className="text-xl font-bold text-white mb-4">Edit Scores</h3>
              <div className="space-y-3 mb-6">
                {game.teams.map((t) => (
                  <div key={t.id} className="flex items-center justify-between gap-4">
                    <span className="text-white font-semibold truncate">{t.name}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditScores((s) => ({ ...s, [t.id]: Math.max(0, (s[t.id] ?? t.score) - 1) }))}
                        className="w-10 h-10 rounded-full bg-white/10 text-white font-bold hover:bg-white/20 transition-colors"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-xl font-black text-white tabular-nums">
                        {editScores[t.id] ?? t.score}
                      </span>
                      <button
                        onClick={() => setEditScores((s) => ({ ...s, [t.id]: (s[t.id] ?? t.score) + 1 }))}
                        className="w-10 h-10 rounded-full bg-white/10 text-white font-bold hover:bg-white/20 transition-colors"
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
                  Save
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scoreboard overlay */}
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
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Leaderboard</h3>
                <button onClick={() => setShowScoreboard(false)} className="text-white/40 hover:text-white">✕</button>
              </div>
              <Scoreboard teams={game.teams} activeTeamId={team.id} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function HostMenu({
  onResume,
  onEndGame,
  onRestartRound,
  onEditScores,
  onSkip,
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
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-6" />
        <h3 className="text-lg font-bold text-white/60 text-center mb-4 uppercase tracking-wider text-sm">Host Menu</h3>

        {confirmEnd ? (
          <div className="space-y-3">
            <p className="text-white text-center font-semibold">End the game?</p>
            <p className="text-white/50 text-center text-sm">Your progress will be lost.</p>
            <div className="flex gap-3 mt-4">
              <Button variant="ghost" fullWidth onClick={() => setConfirmEnd(false)}>Cancel</Button>
              <Button variant="danger" fullWidth onClick={onEndGame}>End Game</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {[
              { label: '▶ Resume', action: onResume, variant: 'primary' as const },
              { label: '⏩ Skip Prompt', action: onSkip, variant: 'secondary' as const },
              { label: '↩ Restart Round', action: onRestartRound, variant: 'secondary' as const },
              { label: '✏️ Edit Scores', action: onEditScores, variant: 'secondary' as const },
              { label: '✕ End Game', action: () => setConfirmEnd(true), variant: 'danger' as const },
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
