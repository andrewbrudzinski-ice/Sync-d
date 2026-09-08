import { motion } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import { Button } from '../ui/Button';

export function HistoryScreen() {
  const { setScreen, history, clearHistory } = useGameStore();

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
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
          <h1 className="text-xl font-bold flex-1">Game History</h1>
          {history.length > 0 && (
            <button
              onClick={() => { if (confirm('Clear all history?')) clearHistory(); }}
              className="text-red-400 text-sm hover:text-red-300 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 px-6 py-6 max-w-lg mx-auto w-full overflow-y-auto">
        {history.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="text-6xl mb-4">📋</div>
            <div className="text-white/50 text-lg font-semibold">No games yet</div>
            <div className="text-white/30 text-sm mt-2">Completed games will appear here</div>
            <Button variant="primary" size="md" className="mt-6" onClick={() => setScreen('setup')}>
              Play Your First Game
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {history.map((entry, i) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="bg-white/5 border border-white/10 rounded-3xl p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">🏆</span>
                      <span className="font-bold text-white">{entry.winner}</span>
                    </div>
                    <div className="text-xs text-white/40">{formatDate(entry.completedAt)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-white">{entry.winnerScore}</div>
                    <div className="text-xs text-white/40">pts</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-white/40 mb-3">
                  <span>{entry.totalRounds} rounds</span>
                  <span>·</span>
                  <span>{entry.teamNames.length} teams</span>
                </div>

                <div className="space-y-1">
                  {Object.entries(entry.finalScores)
                    .sort(([, a], [, b]) => b - a)
                    .map(([name, score]) => (
                      <div key={name} className="flex items-center justify-between text-sm">
                        <span className={name === entry.winner ? 'text-white font-semibold' : 'text-white/50'}>
                          {name}
                        </span>
                        <span className={name === entry.winner ? 'text-white font-bold' : 'text-white/50'}>
                          {score} pts
                        </span>
                      </div>
                    ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
