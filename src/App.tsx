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
    // 로비, 셋업, 밤, 밤 결과까지는 다크모드
    // 낮, 투표, 종료(과거기록 포함)는 라이트모드
    if (['LOBBY', 'SETUP', 'NIGHT', 'NIGHT_RESULT'].includes(phase)) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
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
