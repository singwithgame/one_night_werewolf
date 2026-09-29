const fs = require('fs');
let content = fs.readFileSync('src/pages/NightResultPage.tsx', 'utf-8');

// Remove auto-transition
content = content.replace(
  /if \(Object.keys\(data\).length >= total\) \{\n          update\(ref\(db, \`rooms\/\$\{roomId\}\/info\`\), \{ phase: 'DAY', dayStartTime: Date.now\(\) \}\);\n        \}/,
  `// Auto-transition removed\n          setReadyCount(Object.keys(data).length);\n          setTotalCount(total);`
);

// We need state for readyCount and totalCount
content = content.replace(
  /const \[hasChecked, setHasChecked\] = useState\(false\);/,
  `const [hasChecked, setHasChecked] = useState(false);\n  const [readyCount, setReadyCount] = useState(0);\n  const [totalCount, setTotalCount] = useState(0);`
);

// Add the host button at the bottom
const hostButton = `
      {isHost && readyCount === totalCount && totalCount > 0 && (
        <button 
          onClick={() => update(ref(db, \`rooms/\${roomId}/info\`), { phase: 'DAY', dayStartTime: Date.now() })}
          className="w-full mt-4 px-6 py-4 bg-success text-success-foreground rounded-full font-bold tracking-wide animate-pulse shadow-md"
        >
          아침으로 넘어가기 (모두 준비완료)
        </button>
      )}
`;

content = content.replace(
  /    <\/div>\n  \);\n\}/,
  hostButton + "\n    </div>\n  );\n}"
);

fs.writeFileSync('src/pages/NightResultPage.tsx', content);
