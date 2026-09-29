const fs = require('fs');
let content = fs.readFileSync('src/services/gameService.ts', 'utf-8');

// Modify startGame signature and usage
content = content.replace(
  /export const startGame = async \(roomId: string, players: any\[\]\) => \{([\s\S]*?)const deck = getDefaultDeck\(players.length\);/g,
  `export const startGame = async (roomId: string, players: any[], deck: Role[]) => {`
);

fs.writeFileSync('src/services/gameService.ts', content);
