const fs = require('fs');
let content = fs.readFileSync('src/pages/VotingPage.tsx', 'utf-8');

const oldHandleEndGame = `  const handleEndGame = async () => {
    if (!roomId || !isHost) return;
    await update(ref(db, \`rooms/\${roomId}/info\`), { phase: 'END' });
  };`;

const newHandleEndGame = `  const handleEndGame = async () => {
    if (!roomId || !isHost) return;
    try {
      const { get, push, set } = await import('firebase/database');
      const roomSnap = await get(ref(db, \`rooms/\${roomId}\`));
      if (roomSnap.exists()) {
        const historyRef = push(ref(db, 'history'));
        await set(historyRef, {
          roomId: roomId,
          timestamp: Date.now(),
          ...roomSnap.val()
        });
      }
    } catch (e) {
      console.error("히스토리 저장 실패:", e);
    }
    await update(ref(db, \`rooms/\${roomId}/info\`), { phase: 'END' });
  };`;

content = content.replace(oldHandleEndGame, newHandleEndGame);
fs.writeFileSync('src/pages/VotingPage.tsx', content);
console.log("Done");
