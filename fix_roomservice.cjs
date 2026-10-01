const fs = require('fs');
let content = fs.readFileSync('src/services/roomService.ts', 'utf-8');

const oldCreateRoom = `// 방 생성
export const createRoom = async (hostUid: string, nickname: string, timeLimit: number): Promise<string> => {
  const roomCode = generateRoomCode();
  const roomRef = ref(db, \`rooms/\${roomCode}\`);
  
  // 방이 이미 존재하는지 혹시 모를 충돌 체크
  const snapshot = await get(roomRef);
  if (snapshot.exists()) {
    return createRoom(hostUid, nickname, timeLimit); // 재귀 호출로 새 코드 생성
  }`;

const newCreateRoom = `// 방 생성
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
          set(ref(db, \`rooms/\${key}\`), null);
        }
      });
    }
  } catch (e) {
    console.error("오래된 방 정리 실패:", e);
  }

  const roomCode = generateRoomCode();
  const roomRef = ref(db, \`rooms/\${roomCode}\`);
  
  // 방이 이미 존재하는지 혹시 모를 충돌 체크
  const snapshot = await get(roomRef);
  if (snapshot.exists()) {
    return createRoom(hostUid, nickname, timeLimit); // 재귀 호출로 새 코드 생성
  }`;

content = content.replace(oldCreateRoom, newCreateRoom);
fs.writeFileSync('src/services/roomService.ts', content);
console.log("Done");
