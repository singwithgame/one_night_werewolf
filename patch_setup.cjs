const fs = require('fs');
let content = fs.readFileSync('src/pages/SetupPage.tsx', 'utf-8');

// 1. handleRoleCountChange
const oldHandleRole = `  const handleRoleCountChange = async (roleId: Role, delta: number) => {
    if (!isHost || !roomId) return;
    const count = deck.filter(r => r === roleId).length;`;
const newHandleRole = `  const handleRoleCountChange = async (roleId: Role, delta: number) => {
    if (!isHost || !roomId || roleId === 'WEREWOLF') return;
    const count = deck.filter(r => r === roleId).length;`;
content = content.replace(oldHandleRole, newHandleRole);

// 2. setRandomDeck
const oldSetRandom = `  const setRandomDeck = async () => {
    if (!isHost || !roomId) return;
    const newDeck: Role[] = [];
    const base: Role[] = ['WEREWOLF', 'SEER', 'ROBBER', 'TROUBLEMAKER'];
    base.forEach(r => newDeck.push(r));
    
    let attempts = 0;
    while (newDeck.length < requiredCards && attempts < 100) {
      attempts++;
      const randomRole = AVAILABLE_ROLES[Math.floor(Math.random() * AVAILABLE_ROLES.length)];
      const currentCount = newDeck.filter(r => r === randomRole.id).length;
      if (randomRole.id === 'MASON') {`;
const newSetRandom = `  const setRandomDeck = async () => {
    if (!isHost || !roomId) return;
    const newDeck: Role[] = [];
    const base: Role[] = ['WEREWOLF', 'WEREWOLF', 'SEER', 'ROBBER', 'TROUBLEMAKER'];
    base.forEach(r => newDeck.push(r));
    
    let attempts = 0;
    while (newDeck.length < requiredCards && attempts < 100) {
      attempts++;
      const randomRole = AVAILABLE_ROLES[Math.floor(Math.random() * AVAILABLE_ROLES.length)];
      if (randomRole.id === 'WEREWOLF') continue; // 늑대인간은 고정
      const currentCount = newDeck.filter(r => r === randomRole.id).length;
      if (randomRole.id === 'MASON') {`;
content = content.replace(oldSetRandom, newSetRandom);

// 3. UI Buttons
const oldBtnMinus = `<button
                    onClick={() => handleRoleCountChange(role.id, -1)}
                    disabled={!isHost || count === 0}
                    className="w-8 h-8 rounded-md bg-surface-dark border border-border text-foreground hover:bg-muted disabled:opacity-50 font-bold"
                  >
                    -
                  </button>`;
const newBtnMinus = `<button
                    onClick={() => handleRoleCountChange(role.id, -1)}
                    disabled={!isHost || count === 0 || role.id === 'WEREWOLF'}
                    className="w-8 h-8 rounded-md bg-surface-dark border border-border text-foreground hover:bg-muted disabled:opacity-50 font-bold"
                  >
                    -
                  </button>`;
content = content.replace(oldBtnMinus, newBtnMinus);

const oldBtnPlus = `<button
                    onClick={() => handleRoleCountChange(role.id, 1)}
                    disabled={!isHost || count >= role.max || (role.id === 'MASON' ? deck.length + 2 > requiredCards : deck.length >= requiredCards)}
                    className="w-8 h-8 rounded-md bg-surface-dark border border-border text-foreground hover:bg-muted disabled:opacity-50 font-bold"
                  >
                    +
                  </button>`;
const newBtnPlus = `<button
                    onClick={() => handleRoleCountChange(role.id, 1)}
                    disabled={!isHost || count >= role.max || (role.id === 'MASON' ? deck.length + 2 > requiredCards : deck.length >= requiredCards) || role.id === 'WEREWOLF'}
                    className="w-8 h-8 rounded-md bg-surface-dark border border-border text-foreground hover:bg-muted disabled:opacity-50 font-bold"
                  >
                    +
                  </button>`;
content = content.replace(oldBtnPlus, newBtnPlus);

fs.writeFileSync('src/pages/SetupPage.tsx', content);
console.log("Done");
