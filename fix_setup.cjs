const fs = require('fs');
let content = fs.readFileSync('src/pages/SetupPage.tsx', 'utf-8');

const oldPhaseListener = `    const phaseRef = ref(db, \`rooms/\${roomId}/info/phase\`);
    const unsubscribe = onValue(phaseRef, (snapshot) => {
      if (snapshot.exists()) {
        const newPhase = snapshot.val();
        if (newPhase !== 'SETUP') {
          setPhase(newPhase);
        }
      }
    });`;

const newPhaseListener = `    const phaseRef = ref(db, \`rooms/\${roomId}/info/phase\`);
    const unsubscribe = onValue(phaseRef, (snapshot) => {
      if (snapshot.exists()) {
        const newPhase = snapshot.val();
        if (newPhase !== 'SETUP') {
          setPhase(newPhase);
        }
      } else {
        setPhase('LOBBY');
      }
    });`;

content = content.replace(oldPhaseListener, newPhaseListener);

const leaveLogic = `  const handleLeaveRoom = async () => {
    if (!roomId || !uid) return;
    if (isHost) {
      const { set } = await import('firebase/database');
      await set(ref(db, \`rooms/\${roomId}\`), null);
    } else {
      const { set } = await import('firebase/database');
      await set(ref(db, \`rooms/\${roomId}/players/\${uid}\`), null);
    }
    setPhase('LOBBY');
  };

  const toggleReady = async () => {`;

content = content.replace("  const toggleReady = async () => {", leaveLogic);

const oldUI = `    </div>
  );
}`;

const newUI = `      <button 
        onClick={handleLeaveRoom}
        className="w-full mt-4 text-text-tertiary underline hover:text-destructive transition-colors text-sm"
      >
        대기실에서 나가기
      </button>
    </div>
  );
}`;

content = content.replace(oldUI, newUI);

fs.writeFileSync('src/pages/SetupPage.tsx', content);
console.log("Done");
