import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import { Button } from '../ui/Button';
import { Confetti } from '../ui/Confetti';
import { sounds } from '../../utils/audio';
import { shareResult } from '../../utils/share';

export function ResultsScreen() {
  const { game, setScreen, endGame, startGame, appSettings } = useGameStore();
  const [confettiActive, setConfettiActive] = useState(false);
  const [shareMsg, setShareMsg] = useState('');

  useEffect(() => {
    setConfettiActive(true);
    if (appSettings.soundEffects) sounds.win();
    const t = setTimeout(() => setConfettiActive(false), 5000);
    return () => clearTimeout(t);
  }, []);

  if (!game) return null;

  const sorted = [...game.teams].sort((a, b) => b.score - a.score);
  const winner = sorted[0];
  const isTie = sorted.length > 1 && sorted[0].score === sorted[1].score;

  const totalRounds = game.settings.numberOfRounds;
  const totalMatches = game.teams.reduce((s, t) => s + t.matches, 0);

  const medals = ['🥇', '🥈', '🥉'];

  const handleShare = async () => {
    const success = await shareResult(game);
    setShareMsg(success ? 'Copied to clipboard!' : 'Could not share');
    setTimeout(() => setShareMsg(''), 2000);
  };

  const handlePlayAgain = () => {
    startGame();
  };

  return (
    <div className="bg-game min-h-dvh flex flex-col safe-top safe-bottom">
      <Confetti active={confettiActive} />

      <div className="flex-1 flex flex-col items-center px-6 py-8 max-w-lg mx-auto w-full">

        {/* Trophy + Winner */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
          className="text-center mb-8"
        >
          <motion.div
            animate={{ rotate: [-5, 5, -5], scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="text-8xl mb-4"
          >
            🏆
          </motion.div>
          <div className="text-sm text-white/40 uppercase tracking-widest mb-2">
            {isTie ? 'It\'s a tie!' : 'Winner'}
          </div>
          <h1 className="text-4xl font-black gradient-text mb-2">
            {isTie ? `${sorted[0].name} & ${sorted[1].name}` : winner.name}
          </h1>
          <div className="text-5xl font-black text-white">
            {winner.score}
            <span className="text-xl text-white/40 font-semibold ml-2">
              {winner.score === 1 ? 'match' : 'matches'}
            </span>
          </div>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-3 gap-3 w-full mb-8"
        >
          {[
            { label: 'Rounds', value: totalRounds },
            { label: 'Total Matches', value: totalMatches },
            { label: 'Teams', value: game.teams.length },
          ].map((s) => (
            <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
              <div className="text-2xl font-black text-white">{s.value}</div>
              <div className="text-xs text-white/40 mt-1">{s.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Final standings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="w-full mb-8"
        >
          <h2 className="text-xs uppercase tracking-widest text-white/40 mb-3">Final Standings</h2>
          <div className="space-y-2">
            {sorted.map((team, i) => (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.55 + i * 0.08 }}
                className={[
                  'flex items-center justify-between p-4 rounded-2xl border',
                  i === 0 && !isTie
                    ? 'bg-gradient-to-r from-amber-600/20 to-yellow-600/20 border-amber-500/40'
                    : 'bg-white/5 border-white/10',
                ].join(' ')}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{medals[i] ?? `${i + 1}.`}</span>
                  <div>
                    <div className="font-bold text-white">{team.name}</div>
                    {team.maxStreak >= 3 && (
                      <div className="text-xs text-orange-300">🔥 Best streak: {team.maxStreak}</div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-white">{team.score}</div>
                  <div className="text-xs text-white/40">{team.matches} {team.matches === 1 ? 'match' : 'matches'}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="w-full space-y-3"
        >
          <Button variant="primary" size="lg" fullWidth onClick={handlePlayAgain}>
            🔄 Play Again
          </Button>
          <Button variant="secondary" size="md" fullWidth onClick={handleShare}>
            {shareMsg || '📤 Share Results'}
          </Button>
          <Button variant="ghost" size="md" fullWidth onClick={() => { endGame(); setScreen('start'); }}>
            Back to Home
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
