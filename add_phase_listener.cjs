const fs = require('fs');
let content = fs.readFileSync('src/pages/NightPage.tsx', 'utf-8');

const listener = `
  useEffect(() => {
    if (!roomId) return;
    const phaseRef = ref(db, \`rooms/\${roomId}/info/phase\`);
    const unsubscribe = onValue(phaseRef, (snapshot) => {
      if (snapshot.exists()) {
        const newPhase = snapshot.val();
        if (newPhase !== 'NIGHT' && newPhase !== 'SETUP') {
          setPhase(newPhase);
        }
      }
    });
    return () => unsubscribe();
  }, [roomId, setPhase]);

  // Firebase에서 데이터 가져오기`;

content = content.replace(/  \/\/ Firebase에서 데이터 가져오기/, listener);
fs.writeFileSync('src/pages/NightPage.tsx', content);
