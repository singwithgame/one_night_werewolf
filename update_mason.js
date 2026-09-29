const fs = require('fs');
let content = fs.readFileSync('src/pages/SetupPage.tsx', 'utf-8');

// Replace handleRoleCountChange
const handleRoleCountChangeStr = `  const handleRoleCountChange = async (roleId: Role, delta: number) => {
    if (!isHost || !roomId) return;
    const count = deck.filter(r => r === roleId).length;
    const roleDef = AVAILABLE_ROLES.find(r => r.id === roleId);
    if (!roleDef) return;

    let newDeck = [...deck];
    if (roleId === 'MASON') {
      if (delta > 0 && count === 0) {
        newDeck.push('MASON', 'MASON');
      } else if (delta < 0 && count === 2) {
        newDeck = newDeck.filter(r => r !== 'MASON');
      }
    } else {
      if (delta > 0 && count < roleDef.max) {
        newDeck.push(roleId);
      } else if (delta < 0 && count > 0) {
        const idx = newDeck.indexOf(roleId);
        if (idx > -1) newDeck.splice(idx, 1);
      }
    }
    
    // DB 동기화
    await update(ref(db, \`rooms/\${roomId}/settings\`), { deck: newDeck });
  };`;
content = content.replace(/  const handleRoleCountChange = async \(roleId: Role, delta: number\) => \{[\s\S]*?\/\/ DB 동기화\n    await update\(ref\(db, `rooms\/\$\{roomId\}\/settings`\), \{ deck: newDeck \}\);\n  \};/g, handleRoleCountChangeStr);

const setRandomDeckStr = `  const setRandomDeck = async () => {
    if (!isHost || !roomId) return;
    const newDeck: Role[] = [];
    const base: Role[] = ['WEREWOLF', 'SEER', 'ROBBER', 'TROUBLEMAKER'];
    base.forEach(r => newDeck.push(r));
    
    let attempts = 0;
    while (newDeck.length < requiredCards && attempts < 100) {
      attempts++;
      const randomRole = AVAILABLE_ROLES[Math.floor(Math.random() * AVAILABLE_ROLES.length)];
      const currentCount = newDeck.filter(r => r === randomRole.id).length;
      
      if (randomRole.id === 'MASON') {
        if (currentCount === 0 && newDeck.length + 2 <= requiredCards) {
          newDeck.push('MASON', 'MASON');
        }
      } else {
        if (currentCount < randomRole.max) {
          newDeck.push(randomRole.id);
        }
      }
    }
    await update(ref(db, \`rooms/\${roomId}/settings\`), { deck: newDeck });
  };`;
content = content.replace(/  const setRandomDeck = async \(\) => \{[\s\S]*?await update\(ref\(db, `rooms\/\$\{roomId\}\/settings`\), \{ deck: newDeck \}\);\n  \};/g, setRandomDeckStr);

fs.writeFileSync('src/pages/SetupPage.tsx', content);
