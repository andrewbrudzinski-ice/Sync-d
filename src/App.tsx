import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from './store/gameStore';
import { StartScreen } from './components/screens/StartScreen';
import { HowToPlayScreen } from './components/screens/HowToPlayScreen';
import { SetupScreen } from './components/screens/SetupScreen';
import { GameplayScreen } from './components/screens/GameplayScreen';
import { ResultsScreen } from './components/screens/ResultsScreen';
import { HistoryScreen } from './components/screens/HistoryScreen';
import { SettingsScreen } from './components/screens/SettingsScreen';
import { CustomPromptsScreen } from './components/screens/CustomPromptsScreen';

const SCREEN_COMPONENTS = {
  start: StartScreen,
  'how-to-play': HowToPlayScreen,
  setup: SetupScreen,
  gameplay: GameplayScreen,
  results: ResultsScreen,
  history: HistoryScreen,
  settings: SettingsScreen,
  'custom-prompts': CustomPromptsScreen,
} as const;

function App() {
  const { screen } = useGameStore();
  const ScreenComponent = SCREEN_COMPONENTS[screen];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={screen}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="min-h-dvh"
      >
        <ScreenComponent />
      </motion.div>
    </AnimatePresence>
  );
}

export default App;
