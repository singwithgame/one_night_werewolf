const fs = require('fs');
let content = fs.readFileSync('src/pages/DayPage.tsx', 'utf-8');

content = content.replace(
  /const \[timeLimit, setTimeLimit\] = useState<number>\(300\);/,
  "const [timeLimit, setTimeLimit] = useState<number>(300);\n  const [endTime, setEndTime] = useState<number | null>(null);\n  const [currentPhase, setCurrentPhase] = useState<string>('DAY');"
);

const oldUseEffectRegex = /useEffect\(\(\) => \{\n    if \(!roomId\) return;\n    const phaseRef[\s\S]*?return \(\) => \{ unsubscribe\(\); unsubDeck\(\); unsubPhase\(\); \};\n  \}, \[roomId, setPhase\]\);/m;

const newUseEffect = `useEffect(() => {
    if (!roomId) return;
    const phaseRef = ref(db, 'rooms/' + roomId + '/info/phase');
    const unsubPhase = onValue(phaseRef, (snap) => {
      if (snap.exists()) {
        const newPhase = snap.val();
        if (newPhase !== 'DAY') setPhase(newPhase);
      }
    });
    
    const deckRef = ref(db, 'rooms/' + roomId + '/settings/deck');
    const unsubDeck = onValue(deckRef, snap => {
      if(snap.exists()) setDeck(snap.val());
    });
    
    const infoRef = ref(db, 'rooms/' + roomId + '/info');
    const unsubscribe = onValue(infoRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        setTimeLimit(data.timeLimit || 300);
        setCurrentPhase(data.phase || 'DAY');
        
        if (data.dayStartTime) {
          const limitMs = (data.timeLimit || 300) * 1000;
          setEndTime(data.dayStartTime + limitMs);
        }
      }
    });

    return () => { unsubscribe(); unsubDeck(); unsubPhase(); };
  }, [roomId, setPhase]);

  useEffect(() => {
    if (!endTime) return;
    
    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
      setTimeLeft(remaining);
      
      if (remaining <= 0 && isHost && currentPhase === 'DAY') {
        update(ref(db, 'rooms/' + roomId + '/info'), { phase: 'VOTING' });
      }
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [endTime, isHost, currentPhase, roomId]);`;

content = content.replace(oldUseEffectRegex, newUseEffect);
fs.writeFileSync('src/pages/DayPage.tsx', content);
console.log("Done");
