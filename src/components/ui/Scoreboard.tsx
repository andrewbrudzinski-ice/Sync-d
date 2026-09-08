import { motion, AnimatePresence } from 'framer-motion';
import type { Team } from '../../types';

interface ScoreboardProps {
  teams: Team[];
  activeTeamId?: string;
  compact?: boolean;
}

export function Scoreboard({ teams, activeTeamId, compact = false }: ScoreboardProps) {
  const sorted = [...teams].sort((a, b) => b.score - a.score);

  return (
    <div className={`space-y-2 ${compact ? '' : ''}`}>
      <AnimatePresence mode="popLayout">
        {sorted.map((team, i) => {
          const isActive = team.id === activeTeamId;
          const rank = i + 1;
          const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;

          return (
            <motion.div
              key={team.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className={[
                'flex items-center justify-between rounded-2xl px-4 py-3 transition-all duration-300',
                isActive
                  ? 'bg-purple-600/30 border border-purple-500/50 shadow-lg shadow-purple-900/20'
                  : 'bg-white/5 border border-white/10',
                compact ? 'py-2' : '',
              ].join(' ')}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={`${compact ? 'text-base' : 'text-lg'} shrink-0`}>{rankEmoji}</span>
                <span
                  className={[
                    'font-semibold truncate',
                    compact ? 'text-sm' : 'text-base',
                    isActive ? 'text-white' : 'text-white/80',
                  ].join(' ')}
                >
                  {team.name}
                </span>
                {team.streak >= 2 && (
                  <span className="text-xs bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded-full shrink-0">
                    🔥 {team.streak}
                  </span>
                )}
              </div>
              <motion.span
                key={team.score}
                initial={{ scale: 1.4, color: '#a78bfa' }}
                animate={{ scale: 1, color: isActive ? '#fff' : 'rgba(255,255,255,0.9)' }}
                className={`font-black tabular-nums shrink-0 ml-2 ${compact ? 'text-lg' : 'text-2xl'}`}
              >
                {team.score}
              </motion.span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
