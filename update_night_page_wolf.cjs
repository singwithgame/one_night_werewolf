const fs = require('fs');
let content = fs.readFileSync('src/pages/NightPage.tsx', 'utf-8');

// Replace the Werewolf logic block inside renderActionArea
const replacement = `      if (myRole === 'WEREWOLF') {
        return (
          <div className="w-full bg-surface-card p-6 rounded-xl border border-border space-y-4 mt-4 text-center">
            <h3 className="font-bold text-lg text-foreground">늑대인간 대기</h3>
            <p className="text-text-secondary text-sm font-medium">당신의 밤 행동(동료 확인 및 외로운 늑대 능력)은 결과 확인 단계에서 진행됩니다.</p>
            <p className="text-text-tertiary text-xs">의심을 피하기 위해 다음 문제를 푸세요.</p>
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
                완료
              </button>
            </form>
          </div>
        );
      }`;

content = content.replace(/      if \(myRole === 'WEREWOLF'\) \{[\s\S]*?            <\/div>\n          \);\n        \}\n      \}/, replacement);
fs.writeFileSync('src/pages/NightPage.tsx', content);
