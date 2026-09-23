import { useEffect, useState } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { db, getLocalUid } from '../lib/firebase';
import { useGameStore } from '../store/gameStore';

export default function SetupPage() {
  const { roomId, isHost, setPhase } = useGameStore();
  const [players, setPlayers] = useState<{ uid: string; nickname: string; isHost: boolean }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!roomId) return;
    const roomRef = ref(db, `rooms/${roomId}/players`);
    const unsubscribe = onValue(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const playerList = Object.keys(data).map(uid => ({
          uid,
          ...data[uid]
        }));
        setPlayers(playerList);
      }
    });

    return () => unsubscribe();
  }, [roomId]);

  // 방장이 게임 시작 버튼 누를 시
  const handleStartGame = async () => {
    if (players.length < 3) {
      alert("최소 3명 이상의 플레이어가 필요합니다!");
      return;
    }
    setLoading(true);
    try {
      // startGame 함수에서 역할 분배와 phase 변경('NIGHT')을 모두 처리함
      const { startGame } = await import('../services/gameService');
      await startGame(roomId, players);
    } catch (e) {
      console.error(e);
      alert("게임 시작 중 오류가 발생했습니다.");
    }
    setLoading(false);
  };

  // 게임 페이즈 변경 감지
  useEffect(() => {
    if (!roomId) return;
    const phaseRef = ref(db, `rooms/${roomId}/info/phase`);
    const unsubscribe = onValue(phaseRef, (snapshot) => {
      if (snapshot.exists()) {
        const newPhase = snapshot.val();
        if (newPhase !== 'SETUP' && newPhase !== 'LOBBY') {
          setPhase(newPhase); // 앱 전역 상태 업데이트 -> 화면 자동 전환됨
        }
      }
    });
    return () => unsubscribe();
  }, [roomId, setPhase]);

  const uid = getLocalUid();

  return (
    <div className="flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-500 w-full text-center">
      <div className="space-y-2">
        <p className="text-caption-uppercase text-text-tertiary">입장 코드</p>
        <h1 className="font-display text-display-xl text-primary tracking-widest">{roomId}</h1>
      </div>

      <div className="w-full bg-surface-card border border-border rounded-xl p-6">
        <h3 className="font-medium text-text-secondary mb-4">
          참가자 목록 ({players.length}명)
        </h3>
        <ul className="space-y-3">
          {players.map((p) => (
            <li 
              key={p.uid} 
              className={`flex items-center justify-between p-3 rounded-lg border ${p.uid === uid ? 'border-primary bg-primary/5' : 'border-transparent bg-input-background'}`}
            >
              <span className="font-medium text-foreground">{p.nickname} {p.uid === uid && '(나)'}</span>
              {p.isHost && (
                <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full font-medium">방장</span>
              )}
            </li>
          ))}
        </ul>
      </div>

      {isHost ? (
        <button 
          onClick={handleStartGame}
          disabled={loading || players.length < 3} // 테스트를 위해 3명 제한
          className="w-full bg-primary text-primary-foreground py-4 rounded-full font-medium tracking-wide hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? '시작 준비 중...' : '게임 시작하기'}
        </button>
      ) : (
        <div className="w-full bg-input-background border border-border py-4 rounded-full text-text-tertiary font-medium">
          방장이 게임을 시작하기를 기다리는 중...
        </div>
      )}
    </div>
  );
}
