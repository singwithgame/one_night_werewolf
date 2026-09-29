const fs = require('fs');
let content = fs.readFileSync('src/pages/NightResultPage.tsx', 'utf-8');

// First, add the phase listener inside the NightResultPage component
const phaseListener = `
  useEffect(() => {
    if (!roomId) return;
    const phaseRef = ref(db, \`rooms/\${roomId}/info/phase\`);
    const unsubscribe = onValue(phaseRef, (snapshot) => {
      if (snapshot.exists()) {
        const newPhase = snapshot.val();
        if (newPhase !== 'NIGHT_RESULT' && newPhase !== 'NIGHT') {
          useGameStore.getState().setPhase(newPhase);
        }
      }
    });
    return () => unsubscribe();
  }, [roomId]);
`;
content = content.replace(/  useEffect\(\(\) => \{\n    \/\/ 플레이어들이 모두 확인했는지 카운트만 계산/, phaseListener + "\n  useEffect(() => {\n    // 플레이어들이 모두 확인했는지 카운트만 계산");

// Second, rewrite the // 3. 불면증... part
const replacement = `
  // 3. 불면증(Insomniac) 및 늑대/미니언/메이슨 동료 확인 (도플갱어가 복사한 직업 포함)
  const nightRoles = { ...data.initialRoles };
  Object.keys(actions).forEach(uid => {
    if (uid.includes('_doppelganger')) {
      nightRoles[uid.replace('_doppelganger', '')] = actions[uid].copiedRole;
    }
  });

  Object.keys(nightRoles).forEach(uid => {
    const r = nightRoles[uid];
    if (r === 'WEREWOLF') {
      const wolves = Object.keys(nightRoles).filter(k => nightRoles[k] === 'WEREWOLF' && k !== uid);
      if (wolves.length > 0) {
        results[uid] = (results[uid] ? results[uid] + '\\n' : '') + \`다른 늑대인간: \${wolves.map(getNickname).join(', ')}\`;
      } else {
        results[uid] = (results[uid] ? results[uid] + '\\n' : '') + \`당신은 유일한 늑대인간입니다.\`;
        const act = actions[uid];
        // 도플갱어가 늑대를 복사한 경우 act는 도플갱어의 액션이거나 없을 수 있음.
        // 원래 늑대인간은 LONE_WOLF 액션을 보냈을 수 있음.
        if (act && act.type === 'LONE_WOLF' && act.centerIndex !== null) {
          results[uid] += \`\\n확인한 중앙 \${act.centerIndex + 1}번 카드: [\${roleNameMap[data.centerRoles[act.centerIndex]]}]\`;
        }
      }
    }
    else if (r === 'MINION') {
      const wolves = Object.keys(nightRoles).filter(k => nightRoles[k] === 'WEREWOLF');
      if (wolves.length > 0) {
        results[uid] = (results[uid] ? results[uid] + '\\n' : '') + \`당신이 돕고 있는 늑대인간: \${wolves.map(getNickname).join(', ')}\`;
      } else {
        results[uid] = (results[uid] ? results[uid] + '\\n' : '') + \`마을에 늑대인간이 없습니다! 안심하세요.\`;
      }
    }
    else if (r === 'MASON') {
      const masons = Object.keys(nightRoles).filter(k => nightRoles[k] === 'MASON' && k !== uid);
      if (masons.length > 0) {
        results[uid] = (results[uid] ? results[uid] + '\\n' : '') + \`다른 프리메이슨: \${masons.map(getNickname).join(', ')}\`;
      } else {
        results[uid] = (results[uid] ? results[uid] + '\\n' : '') + \`당신은 혼자 남은 프리메이슨입니다.\`;
      }
    }
    else if (r === 'INSOMNIAC') {
      results[uid] = (results[uid] ? results[uid] + '\\n' : '') + \`당신의 최종 카드는 [\${roleNameMap[currentRoles[uid]]}] 입니다.\`;
    }
  });`;

content = content.replace(/  \/\/ 3\. 불면증\(Insomniac\) 및 늑대\/미니언\/메이슨 동료 확인 \([\s\S]*?    \}\n  \}\);\n/m, replacement + "\n");
fs.writeFileSync('src/pages/NightResultPage.tsx', content);
