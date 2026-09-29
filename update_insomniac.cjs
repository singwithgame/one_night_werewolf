const fs = require('fs');
let content = fs.readFileSync('src/pages/NightResultPage.tsx', 'utf-8');

const replacement = `
    else if (r === 'INSOMNIAC') {
      let displayRole = currentRoles[uid];
      // 도플갱어가 훔쳐지거나 교환되지 않은 채 불면증 환자 능력을 수행하는 경우, 원래 복사했던 직업을 보여줌
      if (displayRole === 'DOPPELGANGER' && data.initialRoles[uid] === 'DOPPELGANGER') {
        const doppelAct = actions[uid + '_doppelganger'];
        if (doppelAct) displayRole = doppelAct.copiedRole;
      }
      results[uid] = (results[uid] ? results[uid] + '\\n' : '') + \`당신의 최종 카드는 [\$\{roleNameMap[displayRole]\}] 입니다.\`;
    }`;

content = content.replace(/    else if \(r === 'INSOMNIAC'\) \{\n      results\[uid\] = \(results\[uid\] \? results\[uid\] \+ '\\n' : ''\) \+ `당신의 최종 카드는 \[\$\{roleNameMap\[currentRoles\[uid\]\]\}\] 입니다\.`;\n    \}/, replacement);

fs.writeFileSync('src/pages/NightResultPage.tsx', content);
