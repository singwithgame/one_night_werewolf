const fs = require('fs');
let content = fs.readFileSync('src/pages/NightResultPage.tsx', 'utf-8');

// 1. Add lock variable
content = content.replace(
  /\/\/ 간단한 서버리스 역할 액션 계산 시뮬레이터 \(호스트가 한 번만 실행\)\nconst calculateNightActions = async \(roomId: string\) => \{/,
  "// 간단한 서버리스 역할 액션 계산 시뮬레이터 (호스트가 한 번만 실행)\nlet isCalculating = false;\nconst calculateNightActions = async (roomId: string) => {\n  if (isCalculating) return;\n  isCalculating = true;\n  try {"
);

content = content.replace(
  /  updates\[\`rooms\/\$\{roomId\}\/game\/resolved\`\] = true;\n  await update\(ref\(db\), updates\);\n\}/,
  "  updates[`rooms/${roomId}/game/resolved`] = true;\n  await update(ref(db), updates);\n  } finally {\n    isCalculating = false;\n  }\n}"
);

// 2. Doppelganger role update
content = content.replace(
  /results\[uid\.replace\('_doppelganger', ''\)\] = `\$\{getNickname\(act\.target\)\}님의 직업\(\[\$\{roleNameMap\[act\.copiedRole\]\}\]\)을 복사했습니다\.`;/,
  "results[uid.replace('_doppelganger', '')] = `${getNickname(act.target)}님의 직업([${roleNameMap[act.copiedRole]}])을 복사했습니다.`;\n      currentRoles[uid.replace('_doppelganger', '')] = act.copiedRole;"
);

// 3. Lone wolf initial center roles
content = content.replace(
  /const centerRoles = \[\.\.\.data\.centerRoles\];/,
  "const centerRoles = [...data.centerRoles];\n  const initialCenterRoles = [...data.centerRoles];"
);
content = content.replace(
  /updates\[\`rooms\/\$\{roomId\}\/game\/centerRoles\`\] = centerRoles;/,
  "updates[`rooms/${roomId}/game/centerRoles`] = centerRoles;\n  updates[`rooms/${roomId}/game/initialCenterRoles`] = initialCenterRoles;"
);

fs.writeFileSync('src/pages/NightResultPage.tsx', content);
console.log("Done");
