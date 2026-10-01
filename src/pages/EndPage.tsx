import { useState, useEffect } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { db } from '../lib/firebase';
import { useGameStore } from '../store/gameStore';

export default function EndPage() {
  const { roomId, isHost, setPhase } = useGameStore();
  const [votes, setVotes] = useState<Record<string, string>>({});
  const [players, setPlayers] = useState<Record<string, any>>({});
  const [initialRoles, setInitialRoles] = useState<Record<string, string>>({});
  const [finalRoles, setFinalRoles] = useState<Record<string, string>>({});
  const [nightResults, setNightResults] = useState<Record<string, string>>({});

  const roleNameMap: Record<string, string> = {
    WEREWOLF: '늑대인간', MINION: '하수인', MASON: '프리메이슨', SEER: '예언자',
    ROBBER: '강도', TROUBLEMAKER: '말썽쟁이', DRUNK: '주정뱅이', INSOMNIAC: '불면증환자',
    HUNTER: '사냥꾼', TANNER: '무두장이', VILLAGER: '마을주민', DOPPELGANGER: '도플갱어'
  };

  useEffect(() => {
    if (!roomId) return;
    const phaseRef = ref(db, `rooms/${roomId}/info/phase`);
    const unsubPhase = onValue(phaseRef, (snap) => {
      if (snap.exists()) {
        const newPhase = snap.val();
        if (newPhase !== 'END') setPhase(newPhase);
      }
    });
    return () => unsubPhase();
  }, [roomId, setPhase]);

  useEffect(() => {
    if (!roomId) return;
    
    const gameRef = ref(db, `rooms/${roomId}/game`);
    const unsub = onValue(gameRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        setVotes(data.votes || {});
        setInitialRoles(data.initialRoles || {});
        setFinalRoles(data.currentRoles || {});
        setNightResults(data.nightResults || {});
      }
    });

    const playersRef = ref(db, `rooms/${roomId}/players`);
    const unsubPlayers = onValue(playersRef, (snap) => {
      if (snap.exists()) setPlayers(snap.val());
    });

    return () => { unsub(); unsubPlayers(); };
  }, [roomId]);

  // 투표 결과 집계
  const voteCounts: Record<string, number> = {};
  Object.values(votes).forEach(targetUid => {
    voteCounts[targetUid] = (voteCounts[targetUid] || 0) + 1;
  });

  const maxVotes = Math.max(...Object.values(voteCounts), 0);
  // maxVotes가 1이면 무효표(평화)
  const deadPlayers = maxVotes > 1 ? Object.keys(voteCounts).filter(uid => voteCounts[uid] === maxVotes) : [];

  // 승패 판정 로직
  let winningTeam = '';
  let winReason = '';
  
  const deadRoles = deadPlayers.map(uid => finalRoles[uid]);
  const isTannerDead = deadRoles.includes('TANNER');
  const isWolfDead = deadRoles.includes('WEREWOLF');
  
  const wolvesInTown = Object.keys(players).filter(uid => finalRoles[uid] === 'WEREWOLF');
  const minionsInTown = Object.keys(players).filter(uid => finalRoles[uid] === 'MINION');

  if (isTannerDead) {
    winningTeam = '무두장이';
    winReason = '무두장이가 처형당했습니다!';
  } else if (isWolfDead) {
    winningTeam = '마을';
    winReason = '늑대인간이 처형당했습니다!';
  } else {
    // 늑대가 안죽음
    if (wolvesInTown.length > 0) {
      winningTeam = '늑대인간';
      winReason = '늑대인간이 아무도 처형되지 않았습니다!';
    } else {
      // 마을에 늑대가 없음
      if (minionsInTown.length > 0) {
        if (deadRoles.includes('MINION')) {
          winningTeam = '마을';
          winReason = '늑대인간이 없어서 하수인을 처형했습니다!';
        } else {
          winningTeam = '하수인';
          winReason = '늑대인간이 없는데 하수인이 살아남았습니다!';
        }
      } else {
        // 늑대도 없고 하수인도 없음
        if (deadPlayers.length === 0) {
          winningTeam = '마을';
          winReason = '마을에 늑대가 없어 아무도 처형하지 않았습니다! (평화 마을)';
        } else {
          winningTeam = '아무도 승리하지 못함';
          winReason = '마을에 늑대가 없는데 애먼 주민을 처형했습니다!';
        }
      }
    }
  }

  const handleReturnToLobby = async () => {
    if (!roomId || !isHost) return;
    
    // 상태 초기화
    const updates: any = {};
    Object.keys(players).forEach(uid => {
      updates[`rooms/${roomId}/players/${uid}/ready`] = false;
    });
    updates[`rooms/${roomId}/game`] = null; // 게임 데이터 삭제
    updates[`rooms/${roomId}/info/phase`] = 'SETUP';
    
    await update(ref(db), updates);
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-6 animate-in fade-in duration-500 w-full text-center">
      <div className="space-y-1 mt-4 w-full">
        <h1 className="font-display text-4xl font-bold text-primary tracking-tight">Game Over</h1>
        <div className="bg-surface-dark-elevated border border-border p-6 rounded-xl mt-8 shadow-lg w-full">
          <p className="text-xl font-bold text-foreground mb-1">{winningTeam} 승리!</p>
          <p className="text-sm text-text-secondary">{winReason}</p>
        </div>
      </div>

      <div className="w-full bg-surface-card border border-border rounded-xl p-6 shadow-sm space-y-6">
        <div>
          <h3 className="font-medium text-text-primary mb-3">처형된 플레이어</h3>
          {deadPlayers.length > 0 ? (
            <div className="flex flex-wrap gap-2 justify-center">
              {deadPlayers.map(uid => (
                <div key={uid} className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-2 rounded-lg font-bold shadow-sm">
                  {players[uid]?.nickname}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-text-tertiary">아무도 처형되지 않았습니다.</p>
          )}
        </div>

        <div className="border-t border-border pt-6">
          <ul className="space-y-3">
{(() => {
              const rolePriority: Record<string, number> = {
                DOPPELGANGER: 1,
                WEREWOLF: 2,
                MINION: 3,
                MASON: 4,
                SEER: 5,
                ROBBER: 6,
                TROUBLEMAKER: 7,
                DRUNK: 8,
                INSOMNIAC: 9,
                HUNTER: 10,
                TANNER: 11,
                VILLAGER: 12
              };
              
              return Object.keys(players).sort((a, b) => (rolePriority[initialRoles[a]] || 99) - (rolePriority[initialRoles[b]] || 99)).map(uid => {
              const initRole = initialRoles[uid];
              const finalRole = finalRoles[uid];
              const changed = initRole !== finalRole;
              
              const myVote = votes[uid];
              const myVoteTargetName = myVote ? players[myVote]?.nickname : '투표 안함';
              const receivedVotes = Object.values(votes).filter(v => v === uid).length;
              
              return (
                <li key={uid} className="flex flex-col p-4 rounded-xl bg-input-background border border-border space-y-3 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg text-foreground flex items-center gap-2">
                      {players[uid]?.nickname}
                      {receivedVotes > 0 && <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">{receivedVotes}표 받음</span>}
                    </span>
                    <div className="flex items-center gap-2 text-sm">
                      {changed ? (
                        <>
                          <span className="text-text-tertiary line-through">{roleNameMap[initRole]}</span>
                          <span className="text-text-tertiary">➔</span>
                          <span className="text-primary font-bold">{roleNameMap[finalRole]}</span>
                        </>
                      ) : (
                        <span className="text-primary font-bold">{roleNameMap[finalRole]}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-sm text-text-secondary bg-surface-card p-2 rounded border border-border/50">
                    <span className="font-semibold">투표 →</span> {myVoteTargetName}
                  </div>
                  
                  {nightResults[uid] && (
                    <div className="text-sm text-text-secondary bg-primary/5 p-2 rounded border border-primary/20 whitespace-pre-wrap">
                      {nightResults[uid]}
                    </div>
                  )}
                </li>
              );
            })})()}
          </ul>
        </div>
      </div>

      {isHost ? (
        <button 
          onClick={handleReturnToLobby}
          className="w-full px-6 py-4 bg-primary text-primary-foreground rounded-full font-bold tracking-wide hover:opacity-90 transition-opacity shadow-md"
        >
          대기실로 돌아가기 (다시하기)
        </button>
      ) : (
        <p className="text-text-tertiary text-sm">방장이 재시작하기를 기다리는 중...</p>
      )}
    </div>
  );
}
