const fs = require('fs');
let content = fs.readFileSync('src/pages/NightResultPage.tsx', 'utf-8');

const replacement = `
  const gameRef = ref(db, \`rooms/\${roomId}/game\`);
  const gameSnap = await get(gameRef);
  if (!gameSnap.exists()) return;
  
  const playersRef = ref(db, \`rooms/\${roomId}/players\`);
  const playersSnap = await get(playersRef);
  const playersData = playersSnap.exists() ? playersSnap.val() : {};

  const data = gameSnap.val();
  const actions = data.nightActions || {};
  const currentRoles = { ...data.initialRoles };
  const centerRoles = [...data.centerRoles];
  const results: Record<string, string> = {};

  const roleNameMap: Record<string, string> = {
    WEREWOLF: '늑대인간', MINION: '하수인', MASON: '프리메이슨', SEER: '예언자',
    ROBBER: '강도', TROUBLEMAKER: '말썽쟁이', DRUNK: '주정뱅이', INSOMNIAC: '불면증환자',
    HUNTER: '사냥꾼', TANNER: '무두장이', VILLAGER: '마을주민', DOPPELGANGER: '도플갱어'
  };

  const getNickname = (id: string) => playersData[id]?.nickname || '알 수 없음';`;

content = content.replace(/  const gameRef = ref\(db, `rooms\/\$\{roomId\}\/game`\);\n  const gameSnap = await get\(gameRef\);\n  if \(!gameSnap\.exists\(\)\) return;\n  \n  const data = gameSnap\.val\(\);\n  const actions = data\.nightActions \|\| \{\};\n  const currentRoles = \{ \.\.\.data\.initialRoles \};\n  const centerRoles = \[\.\.\.data\.centerRoles\];\n  const results: Record<string, string> = \{\};\n\n  const roleNameMap: Record<string, string> = \{\n    WEREWOLF: '늑대인간', MINION: '하수인', MASON: '프리메이슨', SEER: '예언자',\n    ROBBER: '강도', TROUBLEMAKER: '말썽쟁이', DRUNK: '주정뱅이', INSOMNIAC: '불면증환자',\n    HUNTER: '사냥꾼', TANNER: '무두장이', VILLAGER: '마을주민', DOPPELGANGER: '도플갱어'\n  \};\n\n  const getNickname = \(id: string\) => data\.players\?\.\[id\]\?\.nickname \|\| '알 수 없음';/, replacement);

fs.writeFileSync('src/pages/NightResultPage.tsx', content);
