import { useState, useEffect } from 'react';
import { ref, get } from 'firebase/database';
import { db } from '../lib/firebase';
import { useGameStore } from '../store/gameStore';

export default function HistoryPage() {
  const { setPhase } = useGameStore();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination & Accordion
  const [visibleCount, setVisibleCount] = useState(10);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const roleNameMap: Record<string, string> = {
    WEREWOLF: '늑대인간', MINION: '하수인', MASON: '프리메이슨', SEER: '예언자',
    ROBBER: '강도', TROUBLEMAKER: '말썽쟁이', DRUNK: '주정뱅이', INSOMNIAC: '불면증환자',
    HUNTER: '사냥꾼', TANNER: '무두장이', VILLAGER: '마을주민', DOPPELGANGER: '도플갱어'
  };

  const rolePriority: Record<string, number> = {
    DOPPELGANGER: 1, WEREWOLF: 2, MINION: 3, MASON: 4, SEER: 5,
    ROBBER: 6, TROUBLEMAKER: 7, DRUNK: 8, INSOMNIAC: 9, HUNTER: 10,
    TANNER: 11, VILLAGER: 12
  };

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const historyRef = ref(db, 'history');
        const snap = await get(historyRef);
        if (snap.exists()) {
          const data = snap.val();
          const finishedRooms = Object.values(data)
            .map((room: any) => ({
              ...room,
              timestamp: room.timestamp || room.info?.dayStartTime || Date.now()
            }))
            .sort((a: any, b: any) => b.timestamp - a.timestamp);
            
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

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 10);
  };

  const toggleExpand = (idx: number) => {
    setExpandedId(prev => prev === idx ? null : idx);
  };

  return (
    <div className="flex flex-col items-center justify-start space-y-6 animate-in fade-in duration-500 w-full h-full max-h-screen pt-4 pb-12">
      <div className="flex w-full justify-between items-center border-b border-border pb-4 px-4">
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

      <div className="w-full space-y-4 overflow-y-auto px-4 pb-20">
        {history.slice(0, visibleCount).map((room, idx) => {
          const players = room.players || {};
          const initialRoles = room.game?.initialRoles || {};
          const finalRoles = room.game?.currentRoles || {};
          const nightResults = room.game?.nightResults || {};
          const votes = room.game?.votes || {};

          // 투표 집계
          const voteCounts: Record<string, number> = {};
          Object.values(votes).forEach((targetUid: any) => {
            voteCounts[targetUid] = (voteCounts[targetUid] || 0) + 1;
          });
          const maxVotes = Math.max(...Object.values(voteCounts) as number[], 0);
          const deadPlayers = maxVotes > 1 ? Object.keys(voteCounts).filter(uid => voteCounts[uid] === maxVotes) : [];

          // 승패 판정 로직 복제
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
            if (wolvesInTown.length > 0) {
              winningTeam = '늑대인간';
              winReason = '늑대인간이 아무도 처형되지 않았습니다!';
            } else {
              if (minionsInTown.length > 0) {
                if (deadRoles.includes('MINION')) {
                  winningTeam = '마을';
                  winReason = '늑대인간이 없어서 하수인을 처형했습니다!';
                } else {
                  winningTeam = '하수인';
                  winReason = '늑대인간이 없는데 하수인이 살아남았습니다!';
                }
              } else {
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

          const isExpanded = expandedId === idx;

          return (
            <div key={idx} className="bg-surface-card border-2 border-border rounded-xl shadow-sm hover:border-primary/30 transition-colors overflow-hidden">
              <button 
                onClick={() => toggleExpand(idx)}
                className="w-full bg-surface-dark-elevated p-4 border-b border-border flex justify-between items-center text-left"
              >
                <div>
                  <span className="font-bold text-lg text-primary block">
                    {room.timestamp ? new Date(room.timestamp).toLocaleString() : '시간 정보 없음'}
                  </span>
                  <span className="text-sm font-medium text-foreground mt-1 block">
                    {winningTeam} 승리
                  </span>
                </div>
                <span className="text-text-tertiary text-2xl">
                  {isExpanded ? '−' : '+'}
                </span>
              </button>
              
              {isExpanded && (
                <div className="p-4 space-y-6 animate-in slide-in-from-top-2 duration-300">
                  <div className="bg-input-background p-3 rounded-lg border border-border">
                    
                    <p className="text-sm text-text-secondary">{winReason}</p>
                  </div>

                  <div>
                    <h3 className="font-medium text-text-primary mb-3">처형된 플레이어</h3>
                    {deadPlayers.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {deadPlayers.map(uid => (
                          <div key={uid} className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-2 rounded-lg font-bold shadow-sm">
                            {players[uid]?.nickname}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-text-tertiary text-sm">아무도 처형되지 않았습니다.</p>
                    )}
                  </div>

                  <div className="border-t border-border pt-6">
                    <ul className="space-y-3">
                      {Object.keys(players)
                        .sort((a, b) => (rolePriority[initialRoles[a]] || 99) - (rolePriority[initialRoles[b]] || 99))
                        .map(uid => {
                          const initRole = initialRoles[uid];
                          const finalRole = finalRoles[uid];
                          const changed = initRole !== finalRole;
                          
                          const myVote = votes[uid];
                          const myVoteTargetName = myVote ? players[myVote]?.nickname : '투표 안함';
                          const receivedVotes = voteCounts[uid] || 0;
                          
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
                                      <span className="text-text-tertiary line-through">{roleNameMap[initRole] || initRole}</span>
                                      <span className="text-text-tertiary">➔</span>
                                      <span className="text-primary font-bold">{roleNameMap[finalRole] || finalRole}</span>
                                    </>
                                  ) : (
                                    <span className="text-primary font-bold">{roleNameMap[finalRole] || finalRole}</span>
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
                      })}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {visibleCount < history.length && (
          <button
            onClick={handleLoadMore}
            className="w-full py-4 bg-surface-card border-2 border-border rounded-xl font-bold text-text-secondary hover:text-foreground hover:border-primary/50 transition-colors"
          >
            더 불러오기
          </button>
        )}
      </div>
    </div>
  );
}
