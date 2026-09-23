import { ref, set, get, child, update, onValue, off } from 'firebase/database';
import { db } from '../lib/firebase';
import { GamePhase } from '../store/gameStore';

// 4자리 랜덤 알파벳 방 코드 생성
const generateRoomCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// 방 생성
export const createRoom = async (hostUid: string, nickname: string, timeLimit: number): Promise<string> => {
  const roomCode = generateRoomCode();
  const roomRef = ref(db, `rooms/${roomCode}`);
  
  // 방이 이미 존재하는지 혹시 모를 충돌 체크
  const snapshot = await get(roomRef);
  if (snapshot.exists()) {
    return createRoom(hostUid, nickname, timeLimit); // 재귀 호출로 새 코드 생성
  }

  await set(roomRef, {
    info: {
      hostUid,
      timeLimit,
      phase: 'LOBBY',
      createdAt: Date.now(),
    },
    players: {
      [hostUid]: {
        nickname,
        isHost: true,
      }
    }
  });

  return roomCode;
};

// 방 입장
export const joinRoom = async (roomCode: string, uid: string, nickname: string): Promise<boolean> => {
  const code = roomCode.toUpperCase();
  const roomRef = ref(db, `rooms/${code}`);
  const snapshot = await get(roomRef);

  if (!snapshot.exists()) {
    throw new Error('방을 찾을 수 없습니다.');
  }

  const roomData = snapshot.val();
  if (roomData.info.phase !== 'LOBBY') {
    throw new Error('이미 게임이 시작된 방입니다.');
  }

  // 플레이어 추가
  await update(child(roomRef, 'players'), {
    [uid]: {
      nickname,
      isHost: false,
    }
  });

  return true;
};
