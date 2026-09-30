const fs = require('fs');
let content = fs.readFileSync('src/pages/NightResultPage.tsx', 'utf-8');

// Add initialCenterRoles state
content = content.replace(
  /const \[centerRoles, setCenterRoles\] = useState<string\[\]>\(\[\]\);/,
  "const [centerRoles, setCenterRoles] = useState<string[]>([]);\n  const [initialCenterRoles, setInitialCenterRoles] = useState<string[]>([]);"
);

// Fetch initialCenterRoles
content = content.replace(
  /setCenterRoles\(data\.centerRoles \|\| \[\]\);/,
  "setCenterRoles(data.centerRoles || []);\n        setInitialCenterRoles(data.initialCenterRoles || data.centerRoles || []);"
);

// Use initialCenterRoles in UI
content = content.replace(
  /\}\[centerRoles\[idx\]\] \|\| '알 수 없음'/,
  "}[initialCenterRoles[idx]] || '알 수 없음'"
);

fs.writeFileSync('src/pages/NightResultPage.tsx', content);
console.log("Done");
