const fs = require('fs');
let content = fs.readFileSync('src/pages/NightResultPage.tsx', 'utf-8');

const regex = /        const act = actions\[uid\];\n        if \(act && act\.type === 'LONE_WOLF' && act\.centerIndex !== null\) \{\n          results\[uid\] \+= `\\n확인한 중앙 \$\{act\.centerIndex \+ 1\}번 카드: \[\$\{roleNameMap\[data\.centerRoles\[act\.centerIndex\]\]\}\]`;\n        \}/;

content = content.replace(regex, '');
fs.writeFileSync('src/pages/NightResultPage.tsx', content);
