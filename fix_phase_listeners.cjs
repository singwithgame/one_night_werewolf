const fs = require('fs');

function fix(file, currentPhase) {
  let content = fs.readFileSync(file, 'utf-8');
  content = content.replace(/if \(newPhase !== '[^']+'(?: && newPhase !== '[^']+'){0,2}\) \{?\s*setPhase\(newPhase\);\s*\}?/g, \`if (newPhase !== '\${currentPhase}') setPhase(newPhase);\`);
  content = content.replace(/if \(newPhase !== '[^']+'(?: && newPhase !== '[^']+'){0,2}\) setPhase\(newPhase\);/g, \`if (newPhase !== '\${currentPhase}') setPhase(newPhase);\`);
  
  // Handle NightPage's multiline bracket format
  content = content.replace(/if \\(newPhase !== 'NIGHT' && newPhase !== 'SETUP'\\) \\{\\s*setPhase\\(newPhase\\);\\s*\\}/, "if (newPhase !== 'NIGHT') setPhase(newPhase);");
  content = content.replace(/if \\(newPhase !== 'SETUP' && newPhase !== 'LOBBY'\\) \\{\\s*setPhase\\(newPhase\\);\\s*\\}/, "if (newPhase !== 'SETUP') setPhase(newPhase);");
  content = content.replace(/if \\(newPhase !== 'NIGHT_RESULT' && newPhase !== 'NIGHT'\\) \\{\\s*(?:useGameStore\\.getState\\(\\)\\.)?setPhase\\(newPhase\\);\\s*\\}/, "if (newPhase !== 'NIGHT_RESULT') setPhase(newPhase);");
  
  fs.writeFileSync(file, content);
}

fix('src/pages/SetupPage.tsx', 'SETUP');
fix('src/pages/NightPage.tsx', 'NIGHT');
fix('src/pages/NightResultPage.tsx', 'NIGHT_RESULT');
fix('src/pages/DayPage.tsx', 'DAY');
fix('src/pages/VotingPage.tsx', 'VOTING');
fix('src/pages/EndPage.tsx', 'END');

console.log('Fixed');
