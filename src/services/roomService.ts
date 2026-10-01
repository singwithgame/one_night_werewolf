import { ref, set, get, child, update, onValue, off } from 'firebase/database';
import { db } from '../lib/firebase';

// 6자리 랜덤 숫자 방 코드 생성
const generateRoomCode = () => {
  const chars = '0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// 방 생성
export const createRoom = async (hostUid: string, nickname: string, timeLimit: number): Promise<string> => {
  // 생성 전 오래된 방 청소 (1주일 초과)
  try {
    const allRoomsSnap = await get(ref(db, 'rooms'));
    if (allRoomsSnap.exists()) {
      const rooms = allRoomsSnap.val();
      const now = Date.now();
      const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
      Object.keys(rooms).forEach(key => {
        const room = rooms[key];
        if (room.info && room.info.createdAt && (now - room.info.createdAt > ONE_WEEK)) {
          set(ref(db, `rooms/${key}`), null);
        }
      });
    }
  } catch (e) {
    console.error("오래된 방 정리 실패:", e);
  }

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
      phase: 'SETUP',
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
  if (roomData.info.phase !== 'SETUP') {
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
