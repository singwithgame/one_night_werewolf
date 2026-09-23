import { useState, useEffect } from 'react';
import { ref, get } from 'firebase/database';
import { db } from '../lib/firebase';
import { useGameStore } from '../store/gameStore';

export default function HistoryPage() {
  const { setPhase } = useGameStore();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const roomsRef = ref(db, 'rooms');
        const snap = await get(roomsRef);
        if (snap.exists()) {
          const data = snap.val();
          // 게임이 완료된(phase === 'END') 방들만 필터링하여 배열로 만듦
          const finishedRooms = Object.keys(data)
            .filter(roomId => data[roomId]?.info?.phase === 'END')
            .map(roomId => ({
              roomId,
              ...data[roomId],
              timestamp: data[roomId]?.info?.dayStartTime || 0
            }))
            .sort((a, b) => b.timestamp - a.timestamp); // 최신순 정렬
            
          setHistory(finishedRooms);
        }
      } catch (err) {
        setError('기록을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="flex flex-col items-center justify-start space-y-6 animate-in fade-in duration-500 w-full h-full max-h-screen pt-4 pb-12">
      <div className="flex w-full justify-between items-center border-b border-border pb-4">
        <h1 className="font-display text-2xl font-bold text-primary tracking-tight">과거 기록 열람</h1>
        <button 
          onClick={() => setPhase('LOBBY')}
          className="px-4 py-2 bg-surface-card border-2 border-border text-foreground rounded-lg hover:bg-muted active:scale-95 transition-all font-medium"
        >
          로비로 돌아가기
        </button>
      </div>

      {loading && <p className="text-text-secondary mt-10">기록을 불러오는 중...</p>}
      {error && <p className="text-destructive mt-10">{error}</p>}

      {!loading && !error && history.length === 0 && (
        <p className="text-text-tertiary mt-10">완료된 게임 기록이 없습니다.</p>
      )}

      <div className="w-full space-y-4 overflow-y-auto pr-2 pb-20">
        {history.map((room, idx) => (
          <div key={idx} className="bg-surface-card border-2 border-border p-5 rounded-xl space-y-4 shadow-sm hover:border-primary/30 transition-colors">
            <div className="flex justify-between items-center border-b border-border/50 pb-3">
              <span className="font-bold text-lg text-primary">ROOM: {room.roomId}</span>
              <span className="text-sm text-text-tertiary">
                {room.timestamp ? new Date(room.timestamp).toLocaleString() : '시간 정보 없음'}
              </span>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-text-secondary">최종 결과 (직업)</h3>
              <div className="flex flex-wrap gap-2">
                {room.players && Object.keys(room.players).map(uid => (
                  <div key={uid} className="bg-input-background border border-border px-3 py-1.5 rounded-lg text-sm">
                    <span className="font-medium text-foreground">{room.players[uid]?.nickname}</span>
                    <span className="mx-2 text-text-tertiary">|</span>
                    <span className="text-primary font-bold">{room.game?.currentRoles?.[uid] || '알 수 없음'}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* 처형된 플레이어 표시 */}
            {room.game?.votes && (
              <div className="space-y-2 pt-2">
                <h3 className="text-sm font-semibold text-destructive">처형 결과</h3>
                <p className="text-sm text-foreground bg-destructive/10 px-3 py-2 rounded-lg">
                  {(() => {
                    const votes = room.game.votes;
                    const counts: Record<string, number> = {};
                    Object.values(votes).forEach((t: any) => counts[t] = (counts[t] || 0) + 1);
                    const max = Math.max(...Object.values(counts) as number[], 0);
                    const dead = Object.keys(counts).filter(k => counts[k] === max && max > 1);
                    if (dead.length > 0) {
                      return dead.map(k => room.players?.[k]?.nickname).join(', ') + ' 처형됨';
                    }
                    return '아무도 처형되지 않았습니다.';
                  })()}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
