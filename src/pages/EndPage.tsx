import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db, getLocalUid } from '../lib/firebase';
import { useGameStore } from '../store/gameStore';

export default function EndPage() {
  const { roomId } = useGameStore();
  const [votes, setVotes] = useState<Record<string, string>>({});
  const [players, setPlayers] = useState<Record<string, any>>({});
  const [finalRoles, setFinalRoles] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!roomId) return;
    
    const gameRef = ref(db, `rooms/${roomId}/game`);
    const unsub = onValue(gameRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        setVotes(data.votes || {});
        setFinalRoles(data.currentRoles || {});
      }
    });

    const playersRef = ref(db, `rooms/${roomId}/players`);
    const unsubPlayers = onValue(playersRef, (snap) => {
      if (snap.exists()) {
        setPlayers(snap.val());
      }
    });

    return () => {
      unsub();
      unsubPlayers();
    };
  }, [roomId]);

  // 투표 결과 집계
  const voteCounts: Record<string, number> = {};
  Object.values(votes).forEach(targetUid => {
    voteCounts[targetUid] = (voteCounts[targetUid] || 0) + 1;
  });

  const maxVotes = Math.max(...Object.values(voteCounts), 0);
  const deadPlayers = Object.keys(voteCounts).filter(uid => voteCounts[uid] === maxVotes && maxVotes > 1);
  // maxVotes가 1이면 평화촌(아무도 안 죽음) 조건 처리 등이 필요하나 여기선 간략화

  return (
    <div className="flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-500 w-full text-center">
      <div className="space-y-2">
        <h1 className="font-display text-display-lg text-primary tracking-tight">Game Over</h1>
        <p className="text-body-md text-text-secondary">투표 결과 및 최종 직업을 확인하세요.</p>
      </div>

      <div className="w-full bg-surface-card border border-border rounded-xl p-6 shadow-sm space-y-6">
        <div>
          <h3 className="font-medium text-text-primary mb-3">처형된 플레이어</h3>
          {deadPlayers.length > 0 ? (
            <div className="flex flex-wrap gap-2 justify-center">
              {deadPlayers.map(uid => (
                <div key={uid} className="bg-destructive/10 text-destructive px-4 py-2 rounded-lg font-medium">
                  {players[uid]?.nickname} ({finalRoles[uid]})
                </div>
              ))}
            </div>
          ) : (
            <p className="text-text-tertiary">아무도 처형되지 않았습니다.</p>
          )}
        </div>

        <div className="border-t border-border pt-6">
          <h3 className="font-medium text-text-primary mb-3">최종 직업 공개</h3>
          <ul className="space-y-2">
            {Object.keys(players).map(uid => (
              <li key={uid} className="flex justify-between p-3 rounded-lg bg-input-background border border-border">
                <span className="font-medium text-foreground">{players[uid]?.nickname}</span>
                <span className="text-primary font-bold">{finalRoles[uid]}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <button 
        onClick={() => window.location.reload()}
        className="w-full px-6 py-4 bg-primary text-primary-foreground rounded-full font-medium tracking-wide hover:opacity-90 transition-opacity"
      >
        처음으로 돌아가기
      </button>
    </div>
  );
}
