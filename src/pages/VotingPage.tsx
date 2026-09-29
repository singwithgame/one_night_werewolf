import { useState, useEffect } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { db, getLocalUid } from '../lib/firebase';
import { useGameStore } from '../store/gameStore';

export default function VotingPage() {
  const { roomId, isHost, setPhase } = useGameStore();
  const uid = getLocalUid();
  
  const [players, setPlayers] = useState<{ uid: string; nickname: string }[]>([]);
  const [votes, setVotes] = useState<Record<string, string>>({});
  const myVote = votes[uid];

  useEffect(() => {
    if (!roomId) return;
    const phaseRef = ref(db, `rooms/${roomId}/info/phase`);
    const unsubPhase = onValue(phaseRef, (snap) => {
      if (snap.exists()) {
        const newPhase = snap.val();
        
        if (newPhase !== 'VOTING') setPhase(newPhase);

      }
    });
    return () => unsubPhase();
  }, [roomId, setPhase]);

  useEffect(() => {
    if (!roomId) return;
    const playersRef = ref(db, `rooms/${roomId}/players`);
    const unsubscribePlayers = onValue(playersRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        setPlayers(Object.keys(data).map(key => ({ uid: key, nickname: data[key].nickname })));
      }
    });

    const votesRef = ref(db, `rooms/${roomId}/game/votes`);
    const unsubscribeVotes = onValue(votesRef, (snap) => {
      if (snap.exists()) setVotes(snap.val());
      else setVotes({});
    });

    return () => { unsubscribePlayers(); unsubscribeVotes(); };
  }, [roomId, uid]);

  const handleVote = async (targetId: string) => {
    if (!roomId) return;
    await update(ref(db, `rooms/${roomId}/game/votes`), { [uid]: targetId });
  };

  const handleEndGame = async () => {
    if (!roomId || !isHost) return;
    await update(ref(db, `rooms/${roomId}/info`), { phase: 'END' });
  };

  const votedCount = Object.keys(votes).length;
  const allVoted = votedCount === players.length && players.length > 0;

  return (
    <div className="flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-500 w-full text-center">
      <div className="space-y-2">
        <h1 className="font-display text-4xl font-bold text-destructive tracking-tight">Voting</h1>
        <p className="text-base text-text-secondary">누구를 처형할지 지목하세요. (언제든 변경 가능)</p>
        <p className="text-sm font-medium bg-input-background px-4 py-1 rounded-full border border-border inline-block mt-2">
          투표 현황: {votedCount} / {players.length}
        </p>
      </div>

      <div className="w-full max-w-sm relative">
        <div className="bg-surface-card border border-border rounded-xl p-4 shadow-sm h-72 overflow-y-auto space-y-3 snap-y snap-mandatory scrollbar-hide py-8">
          {players.map(p => (
            <button
              key={p.uid}
              onClick={() => handleVote(p.uid)}
              className={`w-full p-4 rounded-xl font-bold transition-all snap-center flex items-center justify-center ${
                myVote === p.uid 
                ? 'bg-destructive text-destructive-foreground scale-[1.02] shadow-md border-transparent'
                : 'bg-input-background border-border text-foreground hover:bg-muted'
              }`}
            >
              {p.nickname} {p.uid === uid && '(나)'}
            </button>
          ))}
        </div>
        <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-surface-card to-transparent pointer-events-none rounded-t-xl" />
        <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-surface-card to-transparent pointer-events-none rounded-b-xl" />
      </div>

      <div className="w-full">
        {myVote ? (
          <p className="text-primary font-bold animate-pulse">투표가 반영되었습니다. 방장의 집행을 기다리세요.</p>
        ) : (
          <p className="text-text-tertiary">스크롤하여 투표 대상을 선택하세요.</p>
        )}
      </div>

      {isHost && (
        <div className="w-full pt-4 border-t border-border mt-4">
          <button 
            onClick={handleEndGame}
            className={`w-full px-6 py-4 rounded-full font-bold tracking-wide transition-all shadow-md ${
              allVoted 
                ? 'bg-destructive text-destructive-foreground text-lg animate-pulse hover:scale-105 active:scale-95' 
                : 'border border-border text-text-tertiary hover:bg-muted active:scale-95 text-sm'
            }`}
          >
            {allVoted ? '투표 집행 (결과 보기)' : '모두 스킵하고 집행'}
          </button>
        </div>
      )}
    </div>
  );
}
