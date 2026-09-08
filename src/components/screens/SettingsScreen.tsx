import { motion } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';

export function SettingsScreen() {
  const { setScreen, appSettings, updateAppSettings } = useGameStore();

  const toggles = [
    {
      key: 'soundEffects' as const,
      label: 'Sound Effects',
      desc: 'Countdown beeps, match sounds, and celebrations',
      icon: '🔊',
    },
    {
      key: 'vibration' as const,
      label: 'Vibration',
      desc: 'Haptic feedback on countdown and results',
      icon: '📳',
    },
  ];

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
          <h1 className="text-xl font-bold">Settings</h1>
        </div>
      </div>

      <div className="flex-1 px-6 py-6 max-w-lg mx-auto w-full space-y-4 overflow-y-auto">

        <div className="bg-white/5 border border-white/10 rounded-3xl p-4 space-y-2">
          <h3 className="text-xs uppercase tracking-widest text-white/40 font-semibold mb-3">Audio & Feedback</h3>
          {toggles.map((t, i) => (
            <motion.button
              key={t.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              onClick={() => updateAppSettings({ [t.key]: !appSettings[t.key] })}
              className={[
                'w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left',
                appSettings[t.key] ? 'bg-purple-600/20 border-purple-500/60' : 'bg-white/5 border-white/10',
              ].join(' ')}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{t.icon}</span>
                <div>
                  <div className="font-semibold text-white">{t.label}</div>
                  <div className="text-xs text-white/50">{t.desc}</div>
                </div>
              </div>
              <div className={[
                'w-12 h-6 rounded-full transition-all relative shrink-0',
                appSettings[t.key] ? 'bg-purple-600' : 'bg-white/20',
              ].join(' ')}>
                <div className={[
                  'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all',
                  appSettings[t.key] ? 'left-6' : 'left-0.5',
                ].join(' ')} />
              </div>
            </motion.button>
          ))}
        </div>

        {/* About */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-5">
          <h3 className="text-xs uppercase tracking-widest text-white/40 font-semibold mb-4">About</h3>
          <div className="text-center py-4">
            <div className="text-4xl mb-3">🧠</div>
            <div className="text-2xl font-black gradient-text mb-1">Sync'd</div>
            <div className="text-white/40 text-sm mb-3">Think together. Match perfectly.</div>
            <div className="text-white/30 text-xs">v1.0 · No account required · Works offline</div>
          </div>
        </div>
      </div>
    </div>
  );
}
