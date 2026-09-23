import { useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import LobbyPage from './pages/LobbyPage';
import SetupPage from './pages/SetupPage';
import NightPage from './pages/NightPage';
import NightResultPage from './pages/NightResultPage';
import DayPage from './pages/DayPage';
import VotingPage from './pages/VotingPage';
import EndPage from './pages/EndPage';
import { Moon, Sun } from 'lucide-react';

function App() {
  const { phase } = useGameStore();

  // Handle Dark/Light mode based on Phase
  useEffect(() => {
    const root = document.documentElement;
    // Dark mode in Lobby, Setup, Night, End
    // Light mode in Day, Voting
    if (['LOBBY', 'SETUP', 'NIGHT', 'NIGHT_RESULT', 'END'].includes(phase)) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [phase]);

  return (
    <div className="min-h-screen w-full transition-colors duration-700 ease-in-out flex flex-col items-center justify-center p-4">
      {/* Dev Phase Toggle (For testing) */}
      <div className="absolute top-4 right-4 flex gap-2">
        <button 
          onClick={() => useGameStore.getState().setPhase('LOBBY')}
          className="p-2 rounded-full bg-surface-card border border-border text-foreground hover:bg-muted"
        >
          <Moon size={16} />
        </button>
        <button 
          onClick={() => useGameStore.getState().setPhase('DAY')}
          className="p-2 rounded-full bg-surface-card border border-border text-foreground hover:bg-muted"
        >
          <Sun size={16} />
        </button>
      </div>

      <div className="w-full max-w-md mx-auto">
        {phase === 'LOBBY' && <LobbyPage />}
        {phase === 'SETUP' && <SetupPage />}
        {phase === 'NIGHT' && <NightPage />}
        {phase === 'NIGHT_RESULT' && <NightResultPage />}
        {phase === 'DAY' && <DayPage />}
        {phase === 'VOTING' && <VotingPage />}
        {phase === 'END' && <EndPage />}
      </div>
    </div>
  );
}

export default App;
