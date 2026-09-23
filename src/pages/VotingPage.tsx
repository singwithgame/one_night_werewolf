import { useState, useEffect } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { db, getLocalUid } from '../lib/firebase';
import { useGameStore } from '../store/gameStore';

export default function VotingPage() {
  const { roomId, isHost } = useGameStore();
  const uid = getLocalUid();
  
  const [players, setPlayers] = useState<{ uid: string; nickname: string }[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [votes, setVotes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!roomId) return;
    
    // 플레이어 목록 가져오기
    const playersRef = ref(db, `rooms/${roomId}/players`);
    const unsubscribePlayers = onValue(playersRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        setPlayers(Object.keys(data).map(key => ({ uid: key, nickname: data[key].nickname })));
      }
    });

    // 투표 현황 가져오기
    const votesRef = ref(db, `rooms/${roomId}/game/votes`);
    const unsubscribeVotes = onValue(votesRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        setVotes(data);
        if (data[uid]) setHasVoted(true);
      }
    });

    return () => {
      unsubscribePlayers();
      unsubscribeVotes();
    };
  }, [roomId, uid]);

  const handleVote = async () => {
    if (!roomId || !selectedTarget) return;
    try {
      await update(ref(db, `rooms/${roomId}/game/votes`), {
        [uid]: selectedTarget
      });
    } catch (e) {
      console.error(e);
      alert("투표 중 오류가 발생했습니다.");
    }
  };

  const handleEndGame = async () => {
    if (!roomId || !isHost) return;
    // 투표 종료 및 최종 결과 창으로 이동
    await update(ref(db, `rooms/${roomId}/info`), { phase: 'END' });
  };

  const allVoted = Object.keys(votes).length === players.length && players.length > 0;

  return (
    <div className="flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-500 w-full">
      <div className="text-center space-y-2">
        <h1 className="font-display text-4xl font-bold text-primary tracking-tight">Voting</h1>
        <p className="text-base text-text-secondary">가장 의심스러운 플레이어를 지목하세요.</p>
      </div>

      <div className="w-full bg-surface-card border border-border rounded-xl p-6 shadow-sm">
        <ul className="space-y-3">
          {players.map(p => (
            <li key={p.uid}>
              <button
                onClick={() => !hasVoted && setSelectedTarget(p.uid)}
                disabled={hasVoted}
                className={`w-full flex items-center justify-between p-4 rounded-lg border transition-colors ${
                  selectedTarget === p.uid 
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border bg-input-background text-foreground hover:bg-muted'
                }`}
              >
                <span className="font-medium">{p.nickname} {p.uid === uid && '(나)'}</span>
                {votes[p.uid] && <span className="text-xs text-text-tertiary">투표완료</span>}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {!hasVoted ? (
        <button 
          onClick={handleVote}
          disabled={!selectedTarget}
          className="w-full px-6 py-4 bg-primary text-primary-foreground rounded-full font-medium tracking-wide hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          선택 완료
        </button>
      ) : (
        <div className="text-center space-y-4 w-full">
          <p className="text-text-primary text-lg font-medium bg-input-background py-4 rounded-full border border-border">
            투표를 완료했습니다. ({Object.keys(votes).length} / {players.length})
          </p>
          
          {isHost && (
            <button 
              onClick={handleEndGame}
              disabled={!allVoted}
              className="w-full px-6 py-4 bg-primary text-primary-foreground rounded-full font-medium tracking-wide hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              결과 보기
            </button>
          )}
        </div>
      )}
    </div>
  );
}
