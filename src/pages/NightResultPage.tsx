import { useState, useEffect } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { db, getLocalUid } from '../lib/firebase';
import { useGameStore } from '../store/gameStore';

export default function NightResultPage() {
  const { roomId, isHost } = useGameStore();
  const uid = getLocalUid();

  const [hasChecked, setHasChecked] = useState(false);
  const [resultMessage, setResultMessage] = useState<string>('계산 중입니다...');
  
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
        setResultMessage('아무런 행동을 하지 않았거나 능력을 사용하지 않았습니다.');
      }
    });

    return () => unsubResult();
  }, [roomId, isHost, uid]);

  const handleCheckDone = async () => {
    setHasChecked(true);
    // 내 상태를 ready로 업데이트
    await update(ref(db, `rooms/${roomId}/game/resultReady`), { [uid]: true });
  };

  useEffect(() => {
    // 모든 플레이어가 확인했는지 체크하여 DAY로 넘어감
    if (!roomId || !isHost) return;
    const readyRef = ref(db, `rooms/${roomId}/game/resultReady`);
    const playersRef = ref(db, `rooms/${roomId}/players`);
    
    let total = 0;
    const unsubPlayers = onValue(playersRef, (snap) => {
      if (snap.exists()) total = Object.keys(snap.val()).length;
    });

    const unsubReady = onValue(readyRef, (snap) => {
      if (snap.exists() && total > 0) {
        const data = snap.val();
        if (Object.keys(data).length >= total) {
          update(ref(db, `rooms/${roomId}/info`), { phase: 'DAY', dayStartTime: Date.now() });
        }
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
        <p className="text-lg font-medium text-foreground whitespace-pre-wrap">{resultMessage}</p>
      </div>

      {!hasChecked ? (
        <button 
          onClick={handleCheckDone}
          className="w-full px-6 py-4 bg-primary text-primary-foreground rounded-full font-medium tracking-wide hover:opacity-90 transition-opacity"
        >
          확인 완료
        </button>
      ) : (
        <p className="text-text-tertiary">다른 플레이어들이 확인하기를 기다리는 중...</p>
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

  // 2. 강도(Robber) & 말썽쟁이(Troublemaker) & 주정뱅이(Drunk) 순서대로 교환 처리
  Object.keys(actions).forEach(uid => {
    const act = actions[uid];
    if (act.type === 'ROBBER') {
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
    else if (act.type === 'SEER') {
      if (act.targets && act.targets.length > 0) {
        results[uid] = (results[uid] ? results[uid] + '\n' : '') + `${getNickname(act.targets[0])}님의 카드는 [${roleNameMap[data.initialRoles[act.targets[0]]]}] 입니다.`;
      } else if (act.centers && act.centers.length === 2) {
        results[uid] = (results[uid] ? results[uid] + '\n' : '') + `중앙 ${act.centers[0] + 1}번은 [${roleNameMap[data.centerRoles[act.centers[0]]]}], ${act.centers[1] + 1}번은 [${roleNameMap[data.centerRoles[act.centers[1]]]}] 입니다.`;
      }
    }
  });

  // 3. 불면증(Insomniac) 및 늑대/미니언/메이슨 동료 확인 (초기 역할 및 현재 역할 기반)
  Object.keys(data.initialRoles).forEach(uid => {
    const r = data.initialRoles[uid];
    if (r === 'WEREWOLF') {
      const wolves = Object.keys(data.initialRoles).filter(k => data.initialRoles[k] === 'WEREWOLF' && k !== uid);
      if (wolves.length > 0) {
        results[uid] = (results[uid] ? results[uid] + '\n' : '') + `다른 늑대인간: ${wolves.map(getNickname).join(', ')}`;
      } else {
        results[uid] = (results[uid] ? results[uid] + '\n' : '') + `당신은 유일한 늑대인간입니다. (원한다면 룰에 따라 중앙 카드 1장을 볼 수 있습니다)`;
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
