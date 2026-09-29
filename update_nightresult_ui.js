const fs = require('fs');
let content = fs.readFileSync('src/pages/NightResultPage.tsx', 'utf-8');

// Replace state and result handling
content = content.replace(
  /const \[resultMessage, setResultMessage\] = useState<string>\('계산 중입니다\.\.\.'\);/,
  `const [resultMessage, setResultMessage] = useState<string>('계산 중입니다...');\n  const [mathProblem, setMathProblem] = useState({ x: 0, y: 0 });\n  const [mathAnswer, setMathAnswer] = useState('');\n  useEffect(() => { setMathProblem({ x: Math.floor(Math.random() * 90) + 10, y: Math.floor(Math.random() * 90) + 10 }); }, []);\n  const handleMathSubmit = (e: React.FormEvent) => { e.preventDefault(); if (parseInt(mathAnswer) === mathProblem.x + mathProblem.y) { handleCheckDone(); } else { alert('틀렸습니다!'); } };`
);

content = content.replace(
  /setResultMessage\('아무런 행동을 하지 않았거나 능력을 사용하지 않았습니다\.'\);/,
  `setResultMessage('NONE');`
);

const uiReplacement = `
      <div className="w-full bg-surface-card border border-border rounded-xl p-8 shadow-sm">
        {resultMessage === 'NONE' ? (
          <div className="space-y-4">
            <p className="text-lg font-medium text-foreground">간밤에 푹 잤습니다. 아침을 기다리며 몸을 푸세요.</p>
            <form onSubmit={handleMathSubmit} className="flex gap-2">
              <div className="flex-1 bg-input-background text-foreground text-xl font-display flex items-center justify-center rounded-md border border-border">
                {mathProblem.x} + {mathProblem.y} =
              </div>
              <input 
                type="number"
                value={mathAnswer}
                onChange={(e) => setMathAnswer(e.target.value)}
                className="w-24 bg-input-background text-foreground text-center text-xl border border-border rounded-md px-2 py-3 focus:outline-none focus:ring-1 focus:ring-ring"
                required
              />
              <button type="submit" className="bg-primary text-primary-foreground px-4 rounded-md font-medium">
                확인 완료
              </button>
            </form>
          </div>
        ) : (
          <p className="text-lg font-medium text-foreground whitespace-pre-wrap">{resultMessage}</p>
        )}
      </div>

      {!hasChecked ? (
        resultMessage !== 'NONE' && (
          <button 
            onClick={handleCheckDone}
            className="w-full px-6 py-4 bg-primary text-primary-foreground rounded-full font-medium tracking-wide hover:opacity-90 transition-opacity"
          >
            확인 완료
          </button>
        )
      ) : (
        <p className="text-text-tertiary">다른 플레이어들이 확인하기를 기다리는 중...</p>
      )}
`;

content = content.replace(
  /<div className="w-full bg-surface-card border border-border rounded-xl p-8 shadow-sm">[\s\S]*?<\/div>[\s\S]*?<\!hasChecked \? \([\s\S]*?<\/button>\n      \) : \([\s\S]*?<\/p>\n      \)}/,
  uiReplacement
);

fs.writeFileSync('src/pages/NightResultPage.tsx', content);
