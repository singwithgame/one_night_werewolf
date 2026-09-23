import { ref, get, update } from 'firebase/database';
import { db } from '../lib/firebase';

export type Role = 
  | 'WEREWOLF' | 'MINION' | 'MASON' | 'SEER' | 'ROBBER' 
  | 'TROUBLEMAKER' | 'DRUNK' | 'INSOMNIAC' | 'HUNTER' | 'TANNER' | 'VILLAGER' | 'DOPPELGANGER';

// 역할 목록 (임시로 3인플용 고정 덱 - 늑대2, 예언자1, 강도1, 말썽쟁이1, 마을주민1)
export const getDefaultDeck = (playerCount: number): Role[] => {
  const base: Role[] = ['WEREWOLF', 'WEREWOLF', 'SEER', 'ROBBER', 'TROUBLEMAKER', 'VILLAGER'];
  // 인원수에 맞춰 추가 (추후 방장이 직접 덱을 고르도록 수정 가능)
  for (let i = 3; i < playerCount; i++) {
    base.push('VILLAGER');
  }
  return base;
};

// 배열 셔플 (Fisher-Yates)
const shuffle = <T,>(array: T[]): T[] => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// 게임 시작 및 역할 분배
export const startGame = async (roomId: string, players: any[]) => {
  const deck = getDefaultDeck(players.length);
  const shuffledDeck = shuffle(deck);

  const initialRoles: Record<string, Role> = {};
  const centerRoles: Role[] = [];

  players.forEach((p, i) => {
    initialRoles[p.uid] = shuffledDeck[i];
  });
  centerRoles.push(shuffledDeck[players.length], shuffledDeck[players.length + 1], shuffledDeck[players.length + 2]);

  const updates: any = {};
  updates[`rooms/${roomId}/game/initialRoles`] = initialRoles; // 초기 역할 (불변)
  updates[`rooms/${roomId}/game/currentRoles`] = initialRoles; // 현재 역할 (교환/약탈 등에 의해 변경됨)
  updates[`rooms/${roomId}/game/centerRoles`] = centerRoles;
  
  // 밤 페이즈 상태 초기화
  updates[`rooms/${roomId}/game/nightActions`] = {};
  updates[`rooms/${roomId}/game/readyPlayers`] = {};
  
  // 페이즈 전환
  updates[`rooms/${roomId}/info/phase`] = 'NIGHT';

  await update(ref(db), updates);
};
