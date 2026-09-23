import { useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import LobbyPage from './pages/LobbyPage';
import SetupPage from './pages/SetupPage';
import NightPage from './pages/NightPage';
import NightResultPage from './pages/NightResultPage';
import DayPage from './pages/DayPage';
import VotingPage from './pages/VotingPage';
import EndPage from './pages/EndPage';
import HistoryPage from './pages/HistoryPage';

function App() {
  const { phase } = useGameStore();

  // Handle Dark/Light mode based on Phase
  useEffect(() => {
    const root = document.documentElement;
    // 사용자의 요청에 따라 모든 페이즈에서 무조건 다크모드 유지
    root.classList.add('dark');
  }, [phase]);

  return (
    <div className="min-h-screen w-full transition-colors duration-700 ease-in-out flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        {phase === 'LOBBY' && <LobbyPage />}
        {phase === 'SETUP' && <SetupPage />}
        {phase === 'NIGHT' && <NightPage />}
        {phase === 'NIGHT_RESULT' && <NightResultPage />}
        {phase === 'DAY' && <DayPage />}
        {phase === 'VOTING' && <VotingPage />}
        {phase === 'END' && <EndPage />}
        {phase === 'HISTORY' && <HistoryPage />}
      </div>
    </div>
  );
}

export default App;
