const fs = require('fs');
let content = fs.readFileSync('src/pages/DayPage.tsx', 'utf-8');

const replacement = `  const [timeLimit, setTimeLimit] = useState<number>(300);
  const [deck, setDeck] = useState<string[]>([]);
  const roleNameMap: Record<string, string> = {
    WEREWOLF: '늑대인간', MINION: '하수인', MASON: '프리메이슨', SEER: '예언자',
    ROBBER: '강도', TROUBLEMAKER: '말썽쟁이', DRUNK: '주정뱅이', INSOMNIAC: '불면증환자',
    HUNTER: '사냥꾼', TANNER: '무두장이', VILLAGER: '마을주민', DOPPELGANGER: '도플갱어'
  };

  useEffect(() => {
    if (!roomId) return;
    const deckRef = ref(db, \`rooms/\${roomId}/settings/deck\`);
    onValue(deckRef, snap => {
      if(snap.exists()) setDeck(snap.val());
    });
    
    // 방 정보`;

content = content.replace(/  const \[timeLimit, setTimeLimit\] = useState<number>\(300\);\n\n  useEffect\(\(\) => \{\n    if \(\!roomId\) return;\n    \n    \/\/ 방 정보/, replacement);

const uiReplacement = `
      {/* 타이머 영역 */}
      <div className="w-full bg-surface-card border border-border rounded-xl p-8 shadow-sm flex items-center justify-center">
        <div className={\`font-display text-[5rem] font-light tracking-tighter \${timeLeft <= 30 ? 'text-destructive animate-pulse' : 'text-foreground'}\`}>
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
      </div>

      <div className="w-full bg-input-background border border-border rounded-xl p-6 text-left">
        <h3 className="text-sm font-bold text-text-secondary mb-3">이번 게임에 포함된 직업 풀</h3>
        <div className="flex flex-wrap gap-2">
          {Array.from(new Set(deck)).map(role => {
            const count = deck.filter(r => r === role).length;
            return (
              <span key={role} className="bg-surface-card border border-border px-3 py-1 rounded-md text-sm font-medium text-foreground">
                {roleNameMap[role]} {count > 1 && <span className="text-primary">x{count}</span>}
              </span>
            );
          })}
        </div>
      </div>
`;

content = content.replace(/      \{\/\* 타이머 영역 \*\/\}\n      <div className="w-full bg-surface-card border border-border rounded-xl p-8 shadow-sm flex items-center justify-center">\n        <div className=\{`font-display text-\[5rem\] font-light tracking-tighter \$\{timeLeft <= 30 \? 'text-destructive animate-pulse' : 'text-foreground'\}`\}>\n          \{String\(minutes\)\.padStart\(2, '0'\)\}:\{String\(seconds\)\.padStart\(2, '0'\)\}\n        <\/div>\n      <\/div>/, uiReplacement);

fs.writeFileSync('src/pages/DayPage.tsx', content);
