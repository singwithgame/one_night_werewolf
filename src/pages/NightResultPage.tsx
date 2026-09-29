import { useState, useEffect } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { db, getLocalUid } from '../lib/firebase';
import { useGameStore } from '../store/gameStore';

export default function NightResultPage() {
  const { roomId, isHost } = useGameStore();
  const uid = getLocalUid();


  const [hasChecked, setHasChecked] = useState(false);
  const [resultMessage, setResultMessage] = useState<string>('계산 중입니다...');
  const [centerRoles, setCenterRoles] = useState<string[]>([]);
  const [revealedCenter, setRevealedCenter] = useState<number | null>(null);
  const [mathProblem, setMathProblem] = useState({ x: 0, y: 0 });
  const [mathAnswer, setMathAnswer] = useState('');


  useEffect(() => {
    if (!roomId) return;
    const centerRef = ref(db, `rooms/${roomId}/game/centerRoles`);
    const unsubscribe = onValue(centerRef, (snap) => {
      if (snap.exists()) setCenterRoles(snap.val());
    });
    return () => unsubscribe();
  }, [roomId]);

  useEffect(() => {
    setMathProblem({
      x: Math.floor(Math.random() * 90) + 10,
      y: Math.floor(Math.random() * 90) + 10
    });
  }, []);
  useEffect(() => {
    if (!roomId) return;

    // 호스트가 결과 계산 로직을 수행함
    if (isHost) {
      calculateNightActions(roomId);
    }
    
    // 개별 결과 메시지를 수신 (예: "당신이 예언자로서 본 카드: A는 늑대인간입니다.")
    const resultRef = ref(db, `rooms/${roomId}/game/nightResults/${uid}`);
    const unsubResult = onValue(resultRef, (snap) => {
      if (snap.exists()) {
        setResultMessage(snap.val());
      } else {
        setResultMessage('NONE');
      }
    });

    return () => unsubResult();
  }, [roomId, isHost, uid]);

  const handleMathSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseInt(mathAnswer) === mathProblem.x + mathProblem.y) {
      handleCheckDone();
    } else {
      alert('틀렸습니다!');
    }
  };

  const handleCheckDone = async () => {
    setHasChecked(true);
    // 내 상태를 ready로 업데이트
    await update(ref(db, `rooms/${roomId}/game/resultReady`), { [uid]: true });
  };

  const [readyCount, setReadyCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (!roomId) return;
    const phaseRef = ref(db, `rooms/${roomId}/info/phase`);
    const unsubscribe = onValue(phaseRef, (snapshot) => {
      if (snapshot.exists()) {
        const newPhase = snapshot.val();
        if (newPhase !== 'NIGHT_RESULT' && newPhase !== 'NIGHT') {
          useGameStore.getState().setPhase(newPhase);
        }
      }
    });
    return () => unsubscribe();
  }, [roomId]);

  useEffect(() => {
    // 플레이어들이 모두 확인했는지 카운트만 계산
    if (!roomId || !isHost) return;
    const readyRef = ref(db, `rooms/${roomId}/game/resultReady`);
    const playersRef = ref(db, `rooms/${roomId}/players`);
    
    let total = 0;
    const unsubPlayers = onValue(playersRef, (snap) => {
      if (snap.exists()) {
        total = Object.keys(snap.val()).length;
        setTotalCount(total);
      }
    });

    const unsubReady = onValue(readyRef, (snap) => {
      if (snap.exists() && total > 0) {
        const data = snap.val();
        setReadyCount(Object.keys(data).length);
      } else {
        setReadyCount(0);
      }
    });
    
    return () => { unsubPlayers(); unsubReady(); };
  }, [roomId, isHost]);

  return (
    <div className="flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-500 w-full text-center">
      <div className="space-y-2">
        <h1 className="font-display text-4xl font-bold text-primary tracking-tight">Night Result</h1>
        <p className="text-base text-text-secondary">간밤에 일어난 결과를 확인하세요.</p>
      </div>


      <div className="w-full bg-surface-card border border-border rounded-xl p-8 shadow-sm">
        {resultMessage.includes('당신은 유일한 늑대인간입니다.') && (
          <div className="mb-6 p-4 bg-primary/10 border border-primary/30 rounded-xl space-y-4">
            <p className="font-bold text-primary">당신은 외로운 늑대입니다! 중앙의 카드 한 장을 확인하세요.</p>
            <div className="flex justify-center gap-3">
              {[0, 1, 2].map((idx) => (
                <button
                  key={idx}
                  disabled={revealedCenter !== null}
                  onClick={() => setRevealedCenter(idx)}
                  className={`w-20 h-28 rounded-lg font-bold transition-all shadow-md flex items-center justify-center ${
                    revealedCenter === idx 
                    ? 'bg-primary text-primary-foreground scale-105' 
                    : revealedCenter !== null 
                      ? 'bg-surface text-text-tertiary opacity-50'
                      : 'bg-card border-2 border-primary/50 text-text-secondary hover:bg-primary/20 active:scale-95'
                  }`}
                >
                  {revealedCenter === idx ? (
                    <span className="text-sm">
                      {
                        {
                          WEREWOLF: '늑대인간', MINION: '하수인', MASON: '프리메이슨', SEER: '예언자',
                          ROBBER: '강도', TROUBLEMAKER: '말썽쟁이', DRUNK: '주정뱅이', INSOMNIAC: '불면증환자',
                          HUNTER: '사냥꾼', TANNER: '무두장이', VILLAGER: '마을주민', DOPPELGANGER: '도플갱어'
                        }[centerRoles[idx]] || '알 수 없음'
                      }
                    </span>
                  ) : (
                    `중앙 ${idx + 1}`
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {resultMessage === 'NONE' ? (

          <div className="space-y-4">
            <p className="text-lg font-medium text-foreground">간밤에 푹 잤습니다. 아침을 기다리며 몸을 푸세요.</p>
            {!hasChecked ? (
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
            ) : (
              <p className="text-text-tertiary">다른 플레이어들이 확인하기를 기다리는 중...</p>
            )}
          </div>
        ) : (
          <p className="text-lg font-medium text-foreground whitespace-pre-wrap">{resultMessage}</p>
        )}
      </div>

      {resultMessage !== 'NONE' && (
        !hasChecked ? (
          <button 
            onClick={handleCheckDone}
            className="w-full px-6 py-4 bg-primary text-primary-foreground rounded-full font-medium tracking-wide hover:opacity-90 transition-opacity"
          >
            확인 완료
          </button>
        ) : (
          <p className="text-text-tertiary">다른 플레이어들이 확인하기를 기다리는 중...</p>
        )
      )}

      {isHost && (
        <button 
          onClick={() => update(ref(db, `rooms/${roomId}/info`), { phase: 'DAY', dayStartTime: Date.now() })}
          className={`px-8 py-4 rounded-full font-bold shadow-md transition-all mt-4 w-full max-w-xs mx-auto block ${
            readyCount === totalCount && totalCount > 0
              ? 'bg-success text-success-foreground text-lg animate-pulse hover:scale-105 active:scale-95'
              : 'border border-border text-text-tertiary hover:bg-muted active:scale-95 text-sm'
          }`}
        >
          {readyCount === totalCount && totalCount > 0 ? '아침으로 넘어가기' : '모두 스킵하고 아침으로'}
        </button>
      )}
    </div>
  );
}

// 간단한 서버리스 역할 액션 계산 시뮬레이터 (호스트가 한 번만 실행)
const calculateNightActions = async (roomId: string) => {
  const { get } = await import('firebase/database');
  
  // 이미 계산했는지 확인
  const resolvedRef = ref(db, `rooms/${roomId}/game/resolved`);
  const resolvedSnap = await get(resolvedRef);
  if (resolvedSnap.exists() && resolvedSnap.val() === true) return;

  const gameRef = ref(db, `rooms/${roomId}/game`);
  const gameSnap = await get(gameRef);
  if (!gameSnap.exists()) return;
  
  const data = gameSnap.val();
  const actions = data.nightActions || {};
  const currentRoles = { ...data.initialRoles };
  const centerRoles = [...data.centerRoles];
  const results: Record<string, string> = {};

  const roleNameMap: Record<string, string> = {
    WEREWOLF: '늑대인간', MINION: '하수인', MASON: '프리메이슨', SEER: '예언자',
    ROBBER: '강도', TROUBLEMAKER: '말썽쟁이', DRUNK: '주정뱅이', INSOMNIAC: '불면증환자',
    HUNTER: '사냥꾼', TANNER: '무두장이', VILLAGER: '마을주민', DOPPELGANGER: '도플갱어'
  };

  const getNickname = (id: string) => data.players?.[id]?.nickname || '알 수 없음';

  // 1. 도플갱어 처리
  Object.keys(actions).forEach(uid => {
    if (uid.includes('_doppelganger')) {
      const act = actions[uid];
      results[uid.replace('_doppelganger', '')] = `${getNickname(act.target)}님의 직업([${roleNameMap[act.copiedRole]}])을 복사했습니다.`;
    }
  });

  // 2. 능력 해결 순서 정렬 (보드게임 룰 반영)
  // 원래 보드게임 룰의 야간 행동 순서:
  // 예언자 -> 강도 -> 말썽쟁이 -> 주정뱅이
  // 도플갱어가 복사한 능력은 원본 직업보다 먼저 실행됨
  const orderedActions: { uid: string; act: any; priority: number }[] = [];
  Object.keys(actions).forEach(uid => {
    if (uid.includes('_doppelganger')) return;
    const act = actions[uid];
    let priority = 99;
    
    if (act.type === 'SEER') priority = data.initialRoles[uid] === 'DOPPELGANGER' ? 1 : 2;
    else if (act.type === 'ROBBER') priority = data.initialRoles[uid] === 'DOPPELGANGER' ? 3 : 4;
    else if (act.type === 'TROUBLEMAKER') priority = data.initialRoles[uid] === 'DOPPELGANGER' ? 5 : 6;
    else if (act.type === 'DRUNK') priority = data.initialRoles[uid] === 'DOPPELGANGER' ? 7 : 8;
    
    orderedActions.push({ uid, act, priority });
  });

  orderedActions.sort((a, b) => a.priority - b.priority);

  // 3. 순서대로 교환 처리
  orderedActions.forEach(({ uid, act }) => {
    if (act.type === 'SEER') {
      // 예언자는 교환을 하지 않으며, 초기 상태(data.initialRoles, data.centerRoles)를 기준으로 봅니다.
      if (act.targets && act.targets.length > 0) {
        results[uid] = (results[uid] ? results[uid] + '\n' : '') + `${getNickname(act.targets[0])}님의 카드는 [${roleNameMap[data.initialRoles[act.targets[0]]]}] 입니다.`;
      } else if (act.centers && act.centers.length === 2) {
        results[uid] = (results[uid] ? results[uid] + '\n' : '') + `중앙 ${act.centers[0] + 1}번은 [${roleNameMap[data.centerRoles[act.centers[0]]]}], ${act.centers[1] + 1}번은 [${roleNameMap[data.centerRoles[act.centers[1]]]}] 입니다.`;
      }
    }
    else if (act.type === 'ROBBER') {
      const target = act.target;
      const stolenRole = currentRoles[target];
      currentRoles[target] = currentRoles[uid];
      currentRoles[uid] = stolenRole;
      results[uid] = (results[uid] ? results[uid] + '\n' : '') + `당신은 ${getNickname(target)}님의 카드([${roleNameMap[stolenRole]}])를 훔쳤습니다.`;
    }
    else if (act.type === 'TROUBLEMAKER') {
      const t1 = act.targets[0];
      const t2 = act.targets[1];
      const temp = currentRoles[t1];
      currentRoles[t1] = currentRoles[t2];
      currentRoles[t2] = temp;
      results[uid] = (results[uid] ? results[uid] + '\n' : '') + `${getNickname(t1)}님과 ${getNickname(t2)}님의 카드를 바꿨습니다.`;
    }
    else if (act.type === 'DRUNK') {
      const idx = act.centerIndex;
      const temp = currentRoles[uid];
      currentRoles[uid] = centerRoles[idx];
      centerRoles[idx] = temp;
      results[uid] = (results[uid] ? results[uid] + '\n' : '') + `중앙 ${idx + 1}번 카드와 카드를 교환했습니다.`;
    }
  });

  // 3. 불면증(Insomniac) 및 늑대/미니언/메이슨 동료 확인 (도플갱어가 복사한 직업 포함)
  const nightRoles = { ...data.initialRoles };
  Object.keys(actions).forEach(uid => {
    if (uid.includes('_doppelganger')) {
      nightRoles[uid.replace('_doppelganger', '')] = actions[uid].copiedRole;
    }
  });

  Object.keys(nightRoles).forEach(uid => {
    const r = nightRoles[uid];
    if (r === 'WEREWOLF') {
      const wolves = Object.keys(nightRoles).filter(k => nightRoles[k] === 'WEREWOLF' && k !== uid);
      if (wolves.length > 0) {
        results[uid] = (results[uid] ? results[uid] + '\n' : '') + `다른 늑대인간: ${wolves.map(getNickname).join(', ')}`;
      } else {
        results[uid] = (results[uid] ? results[uid] + '\n' : '') + `당신은 유일한 늑대인간입니다.`;

      }
    }
    else if (r === 'MINION') {
      const wolves = Object.keys(nightRoles).filter(k => nightRoles[k] === 'WEREWOLF');
      if (wolves.length > 0) {
        results[uid] = (results[uid] ? results[uid] + '\n' : '') + `당신이 돕고 있는 늑대인간: ${wolves.map(getNickname).join(', ')}`;
      } else {
        results[uid] = (results[uid] ? results[uid] + '\n' : '') + `마을에 늑대인간이 없습니다! 안심하세요.`;
      }
    }
    else if (r === 'MASON') {
      const masons = Object.keys(nightRoles).filter(k => nightRoles[k] === 'MASON' && k !== uid);
      if (masons.length > 0) {
        results[uid] = (results[uid] ? results[uid] + '\n' : '') + `다른 프리메이슨: ${masons.map(getNickname).join(', ')}`;
      } else {
        results[uid] = (results[uid] ? results[uid] + '\n' : '') + `당신은 혼자 남은 프리메이슨입니다.`;
      }
    }
    else if (r === 'INSOMNIAC') {
      results[uid] = (results[uid] ? results[uid] + '\n' : '') + `당신의 최종 카드는 [${roleNameMap[currentRoles[uid]]}] 입니다.`;
    }
  });

  // DB 업데이트
  const updates: any = {};
  updates[`rooms/${roomId}/game/currentRoles`] = currentRoles;
  updates[`rooms/${roomId}/game/centerRoles`] = centerRoles;
  updates[`rooms/${roomId}/game/nightResults`] = results;
  updates[`rooms/${roomId}/game/resolved`] = true;
  await update(ref(db), updates);
};
