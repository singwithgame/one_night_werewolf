import { useState, useEffect } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { db, getLocalUid } from '../lib/firebase';
import { useGameStore } from '../store/gameStore';
import type { Role } from '../services/gameService';

export default function NightPage() {
  const { roomId, isHost } = useGameStore();
  const uid = getLocalUid();
  
  const [initialRoles, setInitialRoles] = useState<Record<string, Role>>({});
  const [myRole, setMyRole] = useState<Role | null>(null);
  const [activeRole, setActiveRole] = useState<Role | null>(null); // 도플갱어 복사 시 변경됨
  const [players, setPlayers] = useState<{ uid: string; nickname: string }[]>([]);
  
  const [roleViewStage, setRoleViewStage] = useState<'HIDDEN' | 'REVEALED' | 'ACTION'>('HIDDEN');
  const [seerMode, setSeerMode] = useState<'PLAYER' | 'CENTER'>('PLAYER');
  const [actionDone, setActionDone] = useState(false);
  const [readyCount, setReadyCount] = useState(0);
  const [totalPlayers, setTotalPlayers] = useState(0);
  
  // 상태 선택용
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
  const [selectedCenters, setSelectedCenters] = useState<number[]>([]);

  // 위장용 더미 액션
  const [mathProblem, setMathProblem] = useState({ x: 0, y: 0 });
  const [mathAnswer, setMathAnswer] = useState('');

  useEffect(() => {
    const x = Math.floor(Math.random() * 90) + 10;
    const y = Math.floor(Math.random() * 90) + 10;
    setMathProblem({ x, y });
  }, []);

  useEffect(() => {
    if (!roomId) return;
    
    // 전체 초기 역할 가져오기 (도플갱어 등을 위해)
    // 주의: 실제 서비스에서는 보안상 자기 것만 가져오거나 서버리스 함수로 가려야 하지만, 현재는 로컬 클라이언트 로직으로 처리
    const rolesRef = ref(db, `rooms/${roomId}/game/initialRoles`);
    const unsubRoles = onValue(rolesRef, (snap) => {
      if (snap.exists()) {
        const roles = snap.val();
        setInitialRoles(roles);
        if (!myRole && roles[uid]) {
          setMyRole(roles[uid]);
          setActiveRole(roles[uid]);
        }
      }
    });

    const playersRef = ref(db, `rooms/${roomId}/players`);
    const unsubPlayers = onValue(playersRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        setPlayers(Object.keys(data).map(key => ({ uid: key, nickname: data[key].nickname })));
        setTotalPlayers(Object.keys(data).length);
      }
    });

    const readyRef = ref(db, `rooms/${roomId}/game/readyPlayers`);
    const unsubReady = onValue(readyRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        setReadyCount(Object.keys(data).length);
        if (data[uid]) setActionDone(true);
      } else {
        setReadyCount(0);
      }
    });

    return () => {
      unsubRoles();
      unsubPlayers();
      unsubReady();
    };
  }, [roomId, uid]);

  const submitAction = async (intent: any) => {
    if (!roomId) return;
    await update(ref(db, `rooms/${roomId}/game/nightActions`), {
      [uid]: intent
    });
    await update(ref(db, `rooms/${roomId}/game/readyPlayers`), {
      [uid]: true
    });
  };

  const handleMathSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseInt(mathAnswer) === mathProblem.x + mathProblem.y) {
      submitAction({ type: 'NONE' }); // 능력이 없는 직업의 액션
    } else {
      alert("틀렸습니다. 다시 계산해보세요!");
    }
  };

  const skipToResolution = async () => {
    if (!roomId || !isHost) return;
    // 호스트가 밤을 종료하면 해설(결과) 페이즈로 이동
    await update(ref(db, `rooms/${roomId}/info`), { phase: 'NIGHT_RESULT' });
  };

  const roleNameMap: Record<string, string> = {
    WEREWOLF: '늑대인간', MINION: '하수인', MASON: '프리메이슨', SEER: '예언자',
    ROBBER: '강도', TROUBLEMAKER: '말썽쟁이', DRUNK: '주정뱅이', INSOMNIAC: '불면증환자',
    HUNTER: '사냥꾼', TANNER: '무두장이', VILLAGER: '마을주민', DOPPELGANGER: '도플갱어'
  };

  const renderActiveAction = () => {
    if (!activeRole) return null;

    const otherPlayers = players.filter(p => p.uid !== uid);

    switch (activeRole) {
      case 'DOPPELGANGER':
        return (
          <div className="space-y-4 w-full">
            <p className="text-sm text-text-secondary">능력을 복사할 플레이어를 1명 선택하세요.</p>
            <div className="grid grid-cols-2 gap-2">
              {otherPlayers.map(p => (
                <button 
                  key={p.uid}
                  onClick={() => {
                    const copied = initialRoles[p.uid];
                    alert(`${p.nickname}님의 직업은 [${roleNameMap[copied]}] 입니다! 이제 이 직업의 능력을 수행합니다.`);
                    setActiveRole(copied);
                    // 도플갱어의 첫 번째 인텐트(누굴 복사했는지) 기록
                    update(ref(db, `rooms/${roomId}/game/nightActions/${uid}_doppelganger`), { target: p.uid, copiedRole: copied });
                  }}
                  className="bg-input-background border border-border p-3 rounded-lg text-foreground hover:bg-muted"
                >
                  {p.nickname}
                </button>
              ))}
            </div>
          </div>
        );

      case 'SEER':
        return (
          <div className="space-y-4 w-full">
            <p className="text-sm text-text-secondary">다른 사람의 카드 1장 또는 중앙 카드 2장을 확인하세요.</p>
            <div className="flex gap-4 mb-4">
              <button 
                onClick={() => setSeerMode('PLAYER')}
                className={`flex-1 py-2 rounded-lg border font-medium ${seerMode === 'PLAYER' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground border-border'}`}
              >
                플레이어 1명
              </button>
              <button 
                onClick={() => setSeerMode('CENTER')}
                className={`flex-1 py-2 rounded-lg border font-medium ${seerMode === 'CENTER' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground border-border'}`}
              >
                중앙 2장
              </button>
            </div>
            {seerMode === 'PLAYER' ? (
              <div className="grid grid-cols-2 gap-2">
                {otherPlayers.map(p => (
                  <button 
                    key={p.uid}
                    onClick={() => setSelectedTargets([p.uid])}
                    className={`p-3 rounded-lg border ${selectedTargets.includes(p.uid) ? 'border-primary bg-primary/10' : 'border-border bg-input-background'}`}
                  >
                    {p.nickname}
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {[0, 1, 2].map(idx => (
                  <button
                    key={idx}
                    onClick={() => {
                      const newCenters = selectedCenters.includes(idx) 
                        ? selectedCenters.filter(i => i !== idx)
                        : [...selectedCenters, idx].slice(-2);
                      setSelectedCenters(newCenters);
                    }}
                    className={`p-3 rounded-lg border ${selectedCenters.includes(idx) ? 'border-primary bg-primary/10' : 'border-border bg-input-background'}`}
                  >
                    중앙 {idx + 1}
                  </button>
                ))}
              </div>
            )}
            <button 
              onClick={() => {
                if (seerMode === 'PLAYER') submitAction({ type: 'SEER', targets: selectedTargets });
                else submitAction({ type: 'SEER', centers: selectedCenters });
              }}
              disabled={seerMode === 'PLAYER' ? selectedTargets.length !== 1 : selectedCenters.length !== 2}
              className="w-full bg-primary text-primary-foreground py-3 rounded-full font-medium disabled:opacity-50 mt-4"
            >
              선택 완료
            </button>
          </div>
        );

      case 'ROBBER':
        return (
          <div className="space-y-4 w-full">
            <p className="text-sm text-text-secondary">카드를 훔칠 플레이어 1명을 선택하세요.</p>
            <div className="grid grid-cols-2 gap-2">
              {otherPlayers.map(p => (
                <button 
                  key={p.uid}
                  onClick={() => setSelectedTargets([p.uid])}
                  className={`p-3 rounded-lg border ${selectedTargets.includes(p.uid) ? 'border-primary bg-primary/10' : 'border-border bg-input-background'}`}
                >
                  {p.nickname}
                </button>
              ))}
            </div>
            <button 
              onClick={() => submitAction({ type: 'ROBBER', target: selectedTargets[0] })}
              disabled={selectedTargets.length !== 1}
              className="w-full bg-primary text-primary-foreground py-3 rounded-full font-medium disabled:opacity-50 mt-4"
            >
              선택 완료
            </button>
          </div>
        );
        
      case 'TROUBLEMAKER':
        return (
          <div className="space-y-4 w-full">
            <p className="text-sm text-text-secondary">카드를 서로 바꿀 플레이어 2명을 선택하세요.</p>
            <div className="grid grid-cols-2 gap-2">
              {otherPlayers.map(p => (
                <button 
                  key={p.uid}
                  onClick={() => {
                    const newTargets = selectedTargets.includes(p.uid)
                      ? selectedTargets.filter(t => t !== p.uid)
                      : [...selectedTargets, p.uid].slice(-2);
                    setSelectedTargets(newTargets);
                  }}
                  className={`p-3 rounded-lg border ${selectedTargets.includes(p.uid) ? 'border-primary bg-primary/10' : 'border-border bg-input-background'}`}
                >
                  {p.nickname}
                </button>
              ))}
            </div>
            <button 
              onClick={() => submitAction({ type: 'TROUBLEMAKER', targets: selectedTargets })}
              disabled={selectedTargets.length !== 2}
              className="w-full bg-primary text-primary-foreground py-3 rounded-full font-medium disabled:opacity-50 mt-4"
            >
              선택 완료
            </button>
          </div>
        );

      case 'DRUNK':
        return (
          <div className="space-y-4 w-full">
            <p className="text-sm text-text-secondary">자신의 카드와 바꿀 중앙 카드를 선택하세요.</p>
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map(idx => (
                <button
                  key={idx}
                  onClick={() => setSelectedCenters([idx])}
                  className={`p-3 rounded-lg border ${selectedCenters.includes(idx) ? 'border-primary bg-primary/10' : 'border-border bg-input-background'}`}
                >
                  중앙 {idx + 1}
                </button>
              ))}
            </div>
            <button 
              onClick={() => submitAction({ type: 'DRUNK', centerIndex: selectedCenters[0] })}
              disabled={selectedCenters.length !== 1}
              className="w-full bg-primary text-primary-foreground py-3 rounded-full font-medium disabled:opacity-50 mt-4"
            >
              선택 완료
            </button>
          </div>
        );

      // 능력이 없거나, 아침에 결과를 확인하는 직업들 (늑대인간/불면증/마을주민 등)
      default:
        return (
          <div className="w-full bg-card p-6 rounded-lg border border-border space-y-4 mt-4">
            <p className="text-text-primary text-sm font-medium">당신은 밤에 활동하는 능력이 없거나 위장이 필요합니다.</p>
            <p className="text-text-tertiary text-xs">의심을 피하기 위해 다음 문제를 푸세요.</p>
            <form onSubmit={handleMathSubmit} className="flex gap-2">
              <div className="flex-1 bg-input-background text-foreground text-xl font-display flex items-center justify-center rounded-md border border-border">
                {mathProblem.x} + {mathProblem.y} =
              </div>
              <input 
                type="number"
                value={mathAnswer}
                onChange={(e) => setMathAnswer(e.target.value)}
                className="w-24 bg-input-background text-foreground text-center text-xl border border-border rounded-md px-2 py-3 focus:outline-none focus:ring-1 focus:ring-ring"
                required
              />
              <button type="submit" className="bg-primary text-primary-foreground px-4 rounded-md font-medium">
                완료
              </button>
            </form>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-700 w-full">
      <div className="text-center space-y-2">
        <h1 className="font-display text-4xl font-bold text-primary">Night Phase</h1>
        <p className="text-base text-text-secondary">모두가 행동을 마칠 때까지 기다립니다.</p>
      </div>

      <div className="w-full bg-surface-dark-elevated border border-border rounded-xl p-8 flex flex-col items-center justify-start min-h-[400px] transition-all relative overflow-hidden shadow-lg">
        
        {!actionDone ? (
          <>
            {roleViewStage === 'HIDDEN' && (
              <div className="flex flex-col items-center justify-center h-full space-y-6 flex-1 py-12">
                <p className="text-text-tertiary text-sm text-center px-4">
                  실제 오프라인 게임처럼, 직업 카드는 <strong className="text-foreground">단 한 번만</strong> 확인할 수 있습니다.
                </p>
                <button 
                  onClick={() => setRoleViewStage('REVEALED')}
                  className="px-8 py-4 bg-primary text-primary-foreground font-bold rounded-xl shadow-md hover:scale-105 active:scale-95 transition-transform"
                >
                  내 직업 확인하기
                </button>
              </div>
            )}

            {roleViewStage === 'REVEALED' && (
              <div className="flex flex-col items-center justify-center h-full space-y-8 flex-1 py-12 animate-in fade-in zoom-in duration-300">
                <div className="space-y-2 text-center">
                  <p className="text-text-secondary text-sm uppercase tracking-widest">당신의 역할</p>
                  <h2 className="text-5xl font-bold text-primary font-display">
                    {myRole ? roleNameMap[myRole] : '...'}
                  </h2>
                </div>
                <button 
                  onClick={() => setRoleViewStage('ACTION')}
                  className="px-8 py-4 border-2 border-primary text-primary font-bold rounded-xl hover:bg-primary hover:text-primary-foreground active:scale-95 transition-all shadow-sm"
                >
                  행동 시작하기 (다시 볼 수 없음)
                </button>
              </div>
            )}

            {roleViewStage === 'ACTION' && (
              <div className="flex flex-col items-center space-y-6 text-center w-full animate-in slide-in-from-bottom-4 duration-300">
                <div className="space-y-1 mb-2">
                  <h2 className="text-2xl font-bold text-foreground">행동 페이즈</h2>
                  <p className="text-sm text-text-tertiary">정해진 능력을 수행하세요.</p>
                </div>
                
                {myRole === 'DOPPELGANGER' && activeRole !== 'DOPPELGANGER' && (
                  <div className="bg-primary/10 border border-primary/30 text-primary px-4 py-2 rounded-lg font-medium text-sm">
                    현재 복사한 직업: {activeRole ? roleNameMap[activeRole] : ''}
                  </div>
                )}

                {renderActiveAction()}
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full space-y-4 flex-1 py-12">
            <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-text-primary text-xl font-bold">행동을 완료했습니다.</p>
            <p className="text-text-secondary">다른 플레이어를 기다리는 중... ({readyCount} / {totalPlayers})</p>
          </div>
        )}
      </div>

      {isHost && (
        <button 
          onClick={skipToResolution}
          className="px-6 py-3 border border-border rounded-full text-text-tertiary hover:bg-muted active:scale-95 transition-all text-sm font-medium mt-4"
        >
          모든 행동 스킵하고 결과로 넘어가기
        </button>
      )}
    </div>
  );
}
