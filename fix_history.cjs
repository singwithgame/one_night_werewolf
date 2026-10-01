const fs = require('fs');
let content = fs.readFileSync('src/pages/HistoryPage.tsx', 'utf-8');

const oldFetchHistory = `        const roomsRef = ref(db, 'rooms');
        const snap = await get(roomsRef);
        if (snap.exists()) {
          const data = snap.val();
          // 게임이 완료된(phase === 'END') 방들만 필터링하여 배열로 만듦
          const finishedRooms = Object.keys(data)
            .filter(roomId => data[roomId]?.info?.phase === 'END')
            .map(roomId => ({
              roomId,
              ...data[roomId],
              timestamp: data[roomId]?.info?.dayStartTime || 0
            }))
            .sort((a, b) => b.timestamp - a.timestamp); // 최신순 정렬
            
          setHistory(finishedRooms);
        }`;

const newFetchHistory = `        const historyRef = ref(db, 'history');
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
        }`;

content = content.replace(oldFetchHistory, newFetchHistory);
fs.writeFileSync('src/pages/HistoryPage.tsx', content);
console.log("Done");
