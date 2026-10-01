const fs = require('fs');
let content = fs.readFileSync('src/pages/EndPage.tsx', 'utf-8');

// Add state
content = content.replace(
  /const \[finalRoles, setFinalRoles\] = useState<Record<string, string>>\(\{\}\);/,
  "const [finalRoles, setFinalRoles] = useState<Record<string, string>>({});\n  const [nightResults, setNightResults] = useState<Record<string, string>>({});"
);

// Fetch state
content = content.replace(
  /setFinalRoles\(data\.currentRoles \|\| \{\}\);/,
  "setFinalRoles(data.currentRoles || {});\n        setNightResults(data.nightResults || {});"
);

// Replace UI
const oldUI = `        <div className="border-t border-border pt-6">
          <h3 className="font-medium text-text-primary mb-3">최종 직업 결과</h3>
          <ul className="space-y-2">
            {Object.keys(players).map(uid => {
              const initRole = initialRoles[uid];
              const finalRole = finalRoles[uid];
              const changed = initRole !== finalRole;
              
              return (
                <li key={uid} className="flex justify-between items-center p-3 rounded-lg bg-input-background border border-border">
                  <span className="font-medium text-foreground">{players[uid]?.nickname}</span>
                  <div className="flex items-center gap-2 text-sm">
                    {changed ? (
                      <>
                        <span className="text-text-tertiary line-through">{roleNameMap[initRole]}</span>
                        <span className="text-text-tertiary">➔</span>
                        <span className="text-primary font-bold">{roleNameMap[finalRole]}</span>
                      </>
                    ) : (
                      <span className="text-primary font-bold">{roleNameMap[finalRole]}</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>`;

const newUI = `        <div className="border-t border-border pt-6">
          <ul className="space-y-3">
            {Object.keys(players).map(uid => {
              const initRole = initialRoles[uid];
              const finalRole = finalRoles[uid];
              const changed = initRole !== finalRole;
              
              const myVote = votes[uid];
              const myVoteTargetName = myVote ? players[myVote]?.nickname : '투표 안함';
              const receivedVotes = Object.values(votes).filter(v => v === uid).length;
              
              return (
                <li key={uid} className="flex flex-col p-4 rounded-xl bg-input-background border border-border space-y-3 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg text-foreground flex items-center gap-2">
                      {players[uid]?.nickname}
                      {receivedVotes > 0 && <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">{receivedVotes}표 받음</span>}
                    </span>
                    <div className="flex items-center gap-2 text-sm">
                      {changed ? (
                        <>
                          <span className="text-text-tertiary line-through">{roleNameMap[initRole]}</span>
                          <span className="text-text-tertiary">➔</span>
                          <span className="text-primary font-bold">{roleNameMap[finalRole]}</span>
                        </>
                      ) : (
                        <span className="text-primary font-bold">{roleNameMap[finalRole]}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-sm text-text-secondary bg-surface-card p-2 rounded border border-border/50">
                    <span className="font-semibold">투표:</span> {myVoteTargetName}에게 투표함
                  </div>
                  
                  {nightResults[uid] && (
                    <div className="text-sm text-text-secondary bg-primary/5 p-2 rounded border border-primary/20 whitespace-pre-wrap">
                      <span className="font-semibold text-primary">밤 행동 결과:</span><br/>
                      {nightResults[uid]}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>`;

content = content.replace(oldUI, newUI);
fs.writeFileSync('src/pages/EndPage.tsx', content);
console.log("Done");
