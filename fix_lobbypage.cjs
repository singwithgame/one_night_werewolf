const fs = require('fs');
let content = fs.readFileSync('src/pages/LobbyPage.tsx', 'utf-8');

content = content.replace(
  /<button\n                  key=\{min\}\n                  onClick=\{\(\) => setTimeLimit\(min \* 60\)\}/g,
  '<button\n                  type="button"\n                  key={min}\n                  onClick={() => setTimeLimit(min * 60)}'
);

fs.writeFileSync('src/pages/LobbyPage.tsx', content);
console.log("Done");
