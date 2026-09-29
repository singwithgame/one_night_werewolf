const fs = require('fs');

function addListener(file, importStr, listenerCode) {
  let content = fs.readFileSync(file, 'utf-8');
  if (!content.includes('setPhase')) {
    content = content.replace(/const \{ roomId, isHost \} = useGameStore\(\);/, 'const { roomId, isHost, setPhase } = useGameStore();');
  }
  if (!content.includes('info/phase')) {
    content = content.replace(/  useEffect\(\(\) => \{\n    if \(!roomId\) return;/, `  useEffect(() => {
    if (!roomId) return;
    const phaseRef = ref(db, \`rooms/\${roomId}/info/phase\`);
    const unsubPhase = onValue(phaseRef, (snap) => {
      if (snap.exists()) {
        const newPhase = snap.val();
        ${listenerCode}
      }
    });
    return () => unsubPhase();
  }, [roomId, setPhase]);

  useEffect(() => {
    if (!roomId) return;`);
  }
  fs.writeFileSync(file, content);
}

// 1. DayPage.tsx
addListener('src/pages/DayPage.tsx', '', `
        if (newPhase !== 'DAY') setPhase(newPhase);
`);

// 2. VotingPage.tsx
addListener('src/pages/VotingPage.tsx', '', `
        if (newPhase !== 'VOTING') setPhase(newPhase);
`);

// 3. EndPage.tsx
addListener('src/pages/EndPage.tsx', '', `
        if (newPhase !== 'END') setPhase(newPhase);
`);

console.log("Done");
