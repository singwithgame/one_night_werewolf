const fs = require('fs');
let content = fs.readFileSync('src/pages/NightPage.tsx', 'utf-8');

const wolfBlock = `
      case 'WEREWOLF': {
        const wolves = Object.keys(initialRoles).filter(k => initialRoles[k] === 'WEREWOLF' && k !== uid);
        if (wolves.length === 0) {
          return (
            <div className="space-y-4 w-full">
              <p className="text-sm text-text-secondary">당신은 유일한 늑대인간입니다.<br/>원한다면 중앙 카드 1장을 확인할 수 있습니다.</p>
              <div className="grid grid-cols-3 gap-2">
                {[0, 1, 2].map(idx => (
                  <button
                    key={idx}
                    onClick={() => setSelectedCenters([idx])}
                    className={\`p-3 rounded-lg border \${selectedCenters.includes(idx) ? 'border-primary bg-primary/10' : 'border-border bg-input-background'}\`}
                  >
                    중앙 \${idx + 1}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => submitAction({ type: 'LONE_WOLF', centerIndex: selectedCenters.length > 0 ? selectedCenters[0] : null })}
                className="w-full bg-primary text-primary-foreground py-3 rounded-full font-medium mt-4"
              >
                {selectedCenters.length > 0 ? '선택 완료' : '안 보고 넘어가기'}
              </button>
            </div>
          );
        } else {
          // Other wolves exist, just do minigame
          const wolfNames = wolves.map(w => players.find(p => p.uid === w)?.nickname).join(', ');
          return (
            <div className="w-full bg-card p-6 rounded-lg border border-border space-y-4 mt-4">
              <p className="text-primary font-bold">동료 늑대인간: {wolfNames}</p>
              <p className="text-text-primary text-sm font-medium">당신은 밤에 활동하는 능력이 더 이상 없습니다.</p>
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
        }
      }
`;

content = content.replace(/      \/\/ 능력이 없거나, 아침에 결과를 확인하는 직업들/, wolfBlock + "\n      // 능력이 없거나, 아침에 결과를 확인하는 직업들");
fs.writeFileSync('src/pages/NightPage.tsx', content);
