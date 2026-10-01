import { useEffect, useState } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { db, getLocalUid } from '../lib/firebase';
import { useGameStore } from '../store/gameStore';
import type { Role } from '../services/gameService';

const AVAILABLE_ROLES: { id: Role; label: string; max: number }[] = [
  { id: 'WEREWOLF', label: '늑대인간', max: 2 },
  { id: 'MINION', label: '하수인', max: 1 },
  { id: 'MASON', label: '프리메이슨', max: 2 },
  { id: 'SEER', label: '예언자', max: 1 },
  { id: 'ROBBER', label: '강도', max: 1 },
  { id: 'TROUBLEMAKER', label: '말썽쟁이', max: 1 },
  { id: 'DRUNK', label: '주정뱅이', max: 1 },
  { id: 'INSOMNIAC', label: '불면증환자', max: 1 },
  { id: 'HUNTER', label: '사냥꾼', max: 1 },
  { id: 'TANNER', label: '무두장이', max: 1 },
  { id: 'DOPPELGANGER', label: '도플갱어', max: 1 },
  { id: 'VILLAGER', label: '마을주민', max: 3 },
];

export default function SetupPage() {
  const { roomId, isHost, setPhase } = useGameStore();
  const [players, setPlayers] = useState<{ uid: string; nickname: string; isHost: boolean; ready?: boolean }[]>([]);
  const [loading, setLoading] = useState(false);
  const [deck, setDeck] = useState<Role[]>([]);
  
  const uid = getLocalUid();
  const myPlayer = players.find(p => p.uid === uid);
  const requiredCards = players.length >= 3 ? players.length + 3 : 6;
  const isDeckValid = deck.length === requiredCards;
  const allReady = players.length >= 3 && players.every(p => p.ready);

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

    const deckRef = ref(db, `rooms/${roomId}/settings/deck`);
    const unsubDeck = onValue(deckRef, (snap) => {
      if (snap.exists()) {
        setDeck(snap.val());
      } else if (isHost) {
        // 방장이 처음 들어왔을 때 초기 덱 설정
        const initDeck: Role[] = ['WEREWOLF', 'WEREWOLF', 'SEER', 'ROBBER', 'TROUBLEMAKER', 'VILLAGER'];
        update(ref(db, `rooms/${roomId}/settings`), { deck: initDeck });
      }
    });

    return () => { unsubscribe(); unsubDeck(); };
  }, [roomId, isHost]);

  // 게임 페이즈 변경 감지
  useEffect(() => {
    if (!roomId) return;
    const phaseRef = ref(db, `rooms/${roomId}/info/phase`);
    const unsubscribe = onValue(phaseRef, (snapshot) => {
      if (snapshot.exists()) {
        const newPhase = snapshot.val();
        if (newPhase !== 'SETUP') {
          setPhase(newPhase);
        }
      } else {
        setPhase('LOBBY');
      }
    });
    return () => unsubscribe();
  }, [roomId, setPhase]);

  const handleLeaveRoom = async () => {
    if (!roomId || !uid) return;
    if (isHost) {
      const { set } = await import('firebase/database');
      await set(ref(db, `rooms/${roomId}`), null);
    } else {
      const { set } = await import('firebase/database');
      await set(ref(db, `rooms/${roomId}/players/${uid}`), null);
    }
    setPhase('LOBBY');
  };

  const toggleReady = async () => {
    if (!roomId || !uid) return;
    await update(ref(db, `rooms/${roomId}/players/${uid}`), {
      ready: !(myPlayer?.ready)
    });
  };

  const handleRoleCountChange = async (roleId: Role, delta: number) => {
    if (!isHost || !roomId || roleId === 'WEREWOLF') return;
    const count = deck.filter(r => r === roleId).length;
    const roleDef = AVAILABLE_ROLES.find(r => r.id === roleId);
    if (!roleDef) return;

    let newDeck = [...deck];
    if (roleId === 'MASON') {
      if (delta > 0 && count === 0) {
        newDeck.push('MASON', 'MASON');
      } else if (delta < 0 && count === 2) {
        newDeck = newDeck.filter(r => r !== 'MASON');
      }
    } else {
      if (delta > 0 && count < roleDef.max) {
        newDeck.push(roleId);
      } else if (delta < 0 && count > 0) {
        const idx = newDeck.indexOf(roleId);
        if (idx > -1) newDeck.splice(idx, 1);
      }
    }
    
    // DB 동기화
    await update(ref(db, `rooms/${roomId}/settings`), { deck: newDeck });
  };

  const setRandomDeck = async () => {
    if (!isHost || !roomId) return;
    const newDeck: Role[] = [];
    const base: Role[] = ['WEREWOLF', 'WEREWOLF', 'SEER', 'ROBBER', 'TROUBLEMAKER'];
    base.forEach(r => newDeck.push(r));
    
    let attempts = 0;
    while (newDeck.length < requiredCards && attempts < 100) {
      attempts++;
      const randomRole = AVAILABLE_ROLES[Math.floor(Math.random() * AVAILABLE_ROLES.length)];
      if (randomRole.id === 'WEREWOLF') continue; // 늑대인간은 고정
      const currentCount = newDeck.filter(r => r === randomRole.id).length;
      if (randomRole.id === 'MASON') {
        if (currentCount === 0 && newDeck.length + 2 <= requiredCards) {
          newDeck.push('MASON', 'MASON');
        }
      } else {
        if (currentCount < randomRole.max) {
          newDeck.push(randomRole.id);
        }
      }
    }
    await update(ref(db, `rooms/${roomId}/settings`), { deck: newDeck });
  };

  const handleStartGame = async () => {
    if (!isHost) return;
    if (players.length < 3 || players.length > 13) {
      alert("플레이어는 3~10명이어야 합니다.");
      return;
    }
    if (!isDeckValid) {
      alert(`카드가 ${requiredCards}장 필요합니다. (현재 ${deck.length}장)`);
      return;
    }
    if (!allReady) {
      alert("모든 플레이어가 준비 완료해야 합니다.");
      return;
    }

    setLoading(true);
    try {
      const { startGame } = await import('../services/gameService');
      await startGame(roomId as string, players, deck);
    } catch (e) {
      console.error(e);
      alert("게임 시작 중 오류가 발생했습니다.");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-6 animate-in fade-in duration-500 w-full text-center">
      <div className="space-y-1">
        <p className="text-xs uppercase text-text-tertiary">입장 코드</p>
        <h1 className="font-display text-4xl font-bold text-primary tracking-widest">{roomId}</h1>
      </div>

      <div className="w-full bg-surface-card border border-border rounded-xl p-6">
        <h3 className="font-medium text-text-secondary mb-4 flex justify-between items-center">
          <span>참가자 목록 ({players.length}/10명)</span>
          <span className="text-xs text-text-tertiary">최소 3명 필요</span>
        </h3>
        <ul className="space-y-2">
          {players.map((p) => (
            <li 
              key={p.uid} 
              className={`flex items-center justify-between p-3 rounded-lg border ${p.uid === uid ? 'border-primary/50 bg-primary/10' : 'border-border bg-input-background'}`}
            >
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">{p.nickname} {p.uid === uid && '(나)'}</span>
                {p.isHost && <span className="text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-medium">방장</span>}
              </div>
              <div>
                {p.ready ? (
                  <span className="text-sm text-success font-bold">준비 완료</span>
                ) : (
                  <span className="text-sm text-text-tertiary">대기 중</span>
                )}
              </div>
            </li>
          ))}
        </ul>
        
        <div className="mt-6 pt-4 border-t border-border">
          <button
            onClick={toggleReady}
            className={`w-full py-3 rounded-full font-bold transition-all ${
              myPlayer?.ready 
                ? 'bg-border text-foreground hover:bg-border/80'
                : 'bg-primary text-primary-foreground hover:opacity-90 active:scale-95 shadow-md'
            }`}
          >
            {myPlayer?.ready ? '준비 취소' : '준비 완료'}
          </button>
        </div>
      </div>

      <div className="w-full bg-surface-card border border-border rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium text-text-secondary">
            직업 설정 (현재 {deck.length}장 / 필요 {requiredCards}장)
          </h3>
          {isHost && (
            <button onClick={setRandomDeck} className="text-xs bg-muted text-foreground px-3 py-1 rounded-md hover:bg-border">
              랜덤 구성
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          {AVAILABLE_ROLES.map(role => {
            const count = deck.filter(r => r === role.id).length;
            return (
              <div key={role.id} className="flex items-center justify-between bg-input-background border border-border p-2 rounded-lg">
                <span className={`text-sm ${count > 0 ? 'text-primary font-bold' : 'text-text-tertiary'}`}>
                  {role.label}
                </span>
                {isHost ? (
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleRoleCountChange(role.id, -1)} disabled={count === 0} className="w-6 h-6 rounded-full bg-muted flex items-center justify-center disabled:opacity-30">-</button>
                    <span className="text-sm font-medium w-4 text-center">{count}</span>
                    <button onClick={() => handleRoleCountChange(role.id, 1)} disabled={count === role.max} className="w-6 h-6 rounded-full bg-muted flex items-center justify-center disabled:opacity-30">+</button>
                  </div>
                ) : (
                  <span className="text-sm font-medium">{count}장</span>
                )}
              </div>
            );
          })}
        </div>
        {!isDeckValid && (
          <p className="text-destructive text-sm mt-4 text-center bg-destructive/10 py-2 rounded-lg">
            플레이어 수 + 3장의 카드가 필요합니다!
          </p>
        )}
      </div>

      {isHost && (
        <button 
          onClick={handleStartGame}
          disabled={loading || players.length < 3 || !isDeckValid || !allReady}
          className="w-full bg-primary text-primary-foreground py-4 rounded-full font-bold tracking-wide transition-all disabled:opacity-50 disabled:active:scale-100 hover:scale-[1.02] active:scale-95 shadow-lg mt-4"
        >
          {loading ? '시작 준비 중...' : '게임 시작하기'}
        </button>
      )}
      <button 
        onClick={handleLeaveRoom}
        className="w-full mt-4 text-text-tertiary underline hover:text-destructive transition-colors text-sm"
      >
        대기실에서 나가기
      </button>
    </div>
  );
}
