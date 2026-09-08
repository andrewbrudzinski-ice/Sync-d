import { motion } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import { Button } from '../ui/Button';

const steps = [
  {
    icon: '👥',
    title: 'Form Teams of Two',
    desc: 'Split into pairs. Each pair is a team. You\'ll need to think like your partner!',
  },
  {
    icon: '🎯',
    title: 'Get a Prompt',
    desc: 'The app shows your team a random category like "A fast food restaurant."',
  },
  {
    icon: '🤔',
    title: 'Think Independently',
    desc: 'Both partners think of an answer silently. No whispering, no signals!',
  },
  {
    icon: '3️⃣',
    title: 'Count Down',
    desc: '3… 2… 1… GO! Both partners say their answer at the exact same time.',
    highlight: true,
  },
  {
    icon: '✅',
    title: 'Check for a Match',
    desc: 'If you both said the same thing (or close enough), that\'s a match! The host decides.',
  },
  {
    icon: '🏆',
    title: 'Score Points',
    desc: 'Every match earns your team points. The team with the most points after all rounds wins!',
  },
];

const examples = [
  {
    prompt: 'A fast food restaurant',
    a: 'McDonald\'s',
    b: 'McDonald\'s',
    match: true,
  },
  {
    prompt: 'Something you find at the beach',
    a: 'Sand',
    b: 'Umbrella',
    match: false,
  },
];

export function HowToPlayScreen() {
  const { setScreen } = useGameStore();

  return (
    <div className="bg-game min-h-dvh flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#0f0f1a]/90 backdrop-blur border-b border-white/10">
        <div className="flex items-center gap-4 px-6 py-4 max-w-lg mx-auto w-full">
          <button
            onClick={() => setScreen('start')}
            className="text-white/60 hover:text-white p-2 -ml-2 rounded-xl hover:bg-white/10 transition-colors"
            aria-label="Back"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 className="text-xl font-bold">How to Play</h1>
        </div>
      </div>

      <div className="flex-1 px-6 py-6 max-w-lg mx-auto w-full space-y-8 overflow-y-auto">
        {/* Steps */}
        <div className="space-y-4">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className={[
                'flex gap-4 p-4 rounded-2xl',
                step.highlight
                  ? 'bg-purple-600/20 border border-purple-500/40'
                  : 'bg-white/5 border border-white/10',
              ].join(' ')}
            >
              <div className="text-3xl shrink-0 mt-0.5">{step.icon}</div>
              <div>
                <div className="font-bold text-white mb-1">
                  <span className="text-white/40 text-sm mr-2">{i + 1}.</span>
                  {step.title}
                </div>
                <p className="text-sm text-white/60 leading-relaxed">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Examples */}
        <div>
          <h2 className="text-lg font-bold mb-4 text-white/80">Example Rounds</h2>
          <div className="space-y-4">
            {examples.map((ex, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-4"
              >
                <div className="text-xs text-white/40 uppercase tracking-wider mb-2">Prompt</div>
                <div className="text-base font-bold mb-4 text-white">"{ex.prompt}"</div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[{ label: 'Partner A', answer: ex.a }, { label: 'Partner B', answer: ex.b }].map((p) => (
                    <div key={p.label} className="bg-black/30 rounded-xl p-3 text-center">
                      <div className="text-xs text-white/40 mb-1">{p.label}</div>
                      <div className="font-bold text-white">"{p.answer}"</div>
                    </div>
                  ))}
                </div>
                <div className={[
                  'text-center font-black text-lg py-2 rounded-xl',
                  ex.match
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30',
                ].join(' ')}>
                  {ex.match ? '✓ MATCH! +1 Point' : '✕ No Match'}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Pro tips */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
          <h3 className="font-bold text-amber-400 mb-3">💡 Pro Tips</h3>
          <ul className="space-y-2 text-sm text-white/70">
            <li>• Think of the most obvious, common answer</li>
            <li>• Learn how your partner thinks over time</li>
            <li>• The host always has the final say on matches</li>
            <li>• Close answers can count — it's up to the host!</li>
          </ul>
        </div>
      </div>

      <div className="px-6 pb-8 safe-bottom max-w-lg mx-auto w-full">
        <Button variant="primary" size="lg" fullWidth onClick={() => setScreen('setup')}>
          Let's Play!
        </Button>
      </div>
    </div>
  );
}
