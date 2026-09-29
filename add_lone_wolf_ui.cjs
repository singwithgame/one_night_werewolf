const fs = require('fs');
let content = fs.readFileSync('src/pages/NightResultPage.tsx', 'utf-8');

// 1. Add centerRoles state and loneWolf selection state
const stateAdd = `
  const [hasChecked, setHasChecked] = useState(false);
  const [resultMessage, setResultMessage] = useState<string>('계산 중입니다...');
  const [centerRoles, setCenterRoles] = useState<string[]>([]);
  const [revealedCenter, setRevealedCenter] = useState<number | null>(null);
  const [mathProblem, setMathProblem] = useState({ x: 0, y: 0 });`;

content = content.replace(/  const \[hasChecked, setHasChecked\] = useState\(false\);\n  const \[resultMessage, setResultMessage\] = useState<string>\('계산 중입니다\.\.\.'\);\n  const \[mathProblem, setMathProblem\] = useState\(\{ x: 0, y: 0 \}\);/, stateAdd);

// 2. Fetch centerRoles
const fetchAdd = `
  useEffect(() => {
    if (!roomId) return;
    const centerRef = ref(db, \`rooms/\${roomId}/game/centerRoles\`);
    const unsubscribe = onValue(centerRef, (snap) => {
      if (snap.exists()) setCenterRoles(snap.val());
    });
    return () => unsubscribe();
  }, [roomId]);

  useEffect(() => {
    setMathProblem(`;

content = content.replace(/  useEffect\(\(\) => \{\n    setMathProblem\(/, fetchAdd);

// 3. Update the UI to render the center cards if Lone Wolf
const uiAdd = `
      <div className="w-full bg-surface-card border border-border rounded-xl p-8 shadow-sm">
        {resultMessage.includes('당신은 유일한 늑대인간입니다.') && (
          <div className="mb-6 p-4 bg-primary/10 border border-primary/30 rounded-xl space-y-4">
            <p className="font-bold text-primary">당신은 외로운 늑대입니다! 중앙의 카드 한 장을 확인하세요.</p>
            <div className="flex justify-center gap-3">
              {[0, 1, 2].map((idx) => (
                <button
                  key={idx}
                  disabled={revealedCenter !== null}
                  onClick={() => setRevealedCenter(idx)}
                  className={\`w-20 h-28 rounded-lg font-bold transition-all shadow-md flex items-center justify-center \${
                    revealedCenter === idx 
                    ? 'bg-primary text-primary-foreground scale-105' 
                    : revealedCenter !== null 
                      ? 'bg-surface text-text-tertiary opacity-50'
                      : 'bg-card border-2 border-primary/50 text-text-secondary hover:bg-primary/20 active:scale-95'
                  }\`}
                >
                  {revealedCenter === idx ? (
                    <span className="text-sm">
                      {
                        {
                          WEREWOLF: '늑대인간', MINION: '하수인', MASON: '프리메이슨', SEER: '예언자',
                          ROBBER: '강도', TROUBLEMAKER: '말썽쟁이', DRUNK: '주정뱅이', INSOMNIAC: '불면증환자',
                          HUNTER: '사냥꾼', TANNER: '무두장이', VILLAGER: '마을주민', DOPPELGANGER: '도플갱어'
                        }[centerRoles[idx]] || '알 수 없음'
                      }
                    </span>
                  ) : (
                    \`중앙 \${idx + 1}\`
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {resultMessage === 'NONE' ? (
`;

content = content.replace(/      <div className="w-full bg-surface-card border border-border rounded-xl p-8 shadow-sm">\n        \{resultMessage === 'NONE' \? \(/, uiAdd);

fs.writeFileSync('src/pages/NightResultPage.tsx', content);
