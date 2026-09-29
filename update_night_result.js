const fs = require('fs');
let content = fs.readFileSync('src/pages/NightResultPage.tsx', 'utf-8');

const replacement = `  // 4. 불면증(Insomniac) 및 늑대/미니언/메이슨 동료 확인 (초기 역할 및 현재 역할 기반)
  Object.keys(data.initialRoles).forEach(uid => {
    const r = data.initialRoles[uid];
    if (r === 'WEREWOLF') {
      const wolves = Object.keys(data.initialRoles).filter(k => data.initialRoles[k] === 'WEREWOLF' && k !== uid);
      if (wolves.length > 0) {
        results[uid] = (results[uid] ? results[uid] + '\\n' : '') + \`다른 늑대인간: \${wolves.map(getNickname).join(', ')}\`;
      } else {
        results[uid] = (results[uid] ? results[uid] + '\\n' : '') + \`당신은 유일한 늑대인간입니다.\`;
        const act = actions[uid];
        if (act && act.type === 'LONE_WOLF' && act.centerIndex !== null) {
          results[uid] += \`\\n확인한 중앙 \${act.centerIndex + 1}번 카드: [\${roleNameMap[data.centerRoles[act.centerIndex]]}]\`;
        }
      }
    }
    else if (r === 'MINION') {
      const wolves = Object.keys(data.initialRoles).filter(k => data.initialRoles[k] === 'WEREWOLF');
      if (wolves.length > 0) {
        results[uid] = (results[uid] ? results[uid] + '\\n' : '') + \`당신이 돕고 있는 늑대인간: \${wolves.map(getNickname).join(', ')}\`;
      } else {
        results[uid] = (results[uid] ? results[uid] + '\\n' : '') + \`마을에 늑대인간이 없습니다! 안심하세요.\`;
      }
    }
    else if (r === 'MASON') {
      const masons = Object.keys(data.initialRoles).filter(k => data.initialRoles[k] === 'MASON' && k !== uid);
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

content = content.replace(/  \/\/ 4\. 불면증\(Insomniac\) 및 늑대인간 동료 확인 \(초기 역할 및 현재 역할 기반\)[\s\S]*?    \}\n  \}\);/m, replacement);
fs.writeFileSync('src/pages/NightResultPage.tsx', content);
