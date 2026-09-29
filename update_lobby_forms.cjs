const fs = require('fs');
let content = fs.readFileSync('src/pages/LobbyPage.tsx', 'utf-8');

// Update HISTORY mode
const historyStr = `      <form onSubmit={(e) => {
        e.preventDefault();
        if (password === import.meta.env.VITE_ADMIN_PASSWORD) {
          setPhase('HISTORY');
        } else {
          setError('비밀번호가 일치하지 않습니다.');
        }
      }} className="flex flex-col space-y-8 w-full px-4 animate-in slide-in-from-right-4 duration-300">`;
content = content.replace(/      <div className="flex flex-col space-y-8 w-full px-4 animate-in slide-in-from-right-4 duration-300">[\s\S]*?<h2 className="font-display text-2xl font-bold text-primary">기록 조회<\/h2>/, historyStr + '\n        <div className="text-center">\n          <h2 className="font-display text-2xl font-bold text-primary">기록 조회</h2>');
content = content.replace(/          <button \n            onClick=\{\(\) => \{\n              if \(password === import\.meta\.env\.VITE_ADMIN_PASSWORD\) \{\n                setPhase\('HISTORY'\);\n              \} else \{\n                setError\('비밀번호가 일치하지 않습니다\.'\);\n              \}\n            \}\}\n            className="flex-\[2\] bg-primary text-primary-foreground py-4 rounded-xl font-bold hover:opacity-90 active:scale-\[0\.98\] transition-all flex justify-center shadow-md"\n          >\n            기록 열람하기\n          <\/button>\n        <\/div>\n      <\/div>/, `          <button \n            type="submit"\n            className="flex-[2] bg-primary text-primary-foreground py-4 rounded-xl font-bold hover:opacity-90 active:scale-[0.98] transition-all flex justify-center shadow-md"\n          >\n            기록 열람하기\n          </button>\n        </div>\n      </form>`);

// Update HOST mode
const hostStr = `      <form onSubmit={(e) => {
        e.preventDefault();
        handleCreateRoom();
      }} className="flex flex-col space-y-8 w-full px-4 animate-in slide-in-from-right-4 duration-300">`;
content = content.replace(/      <div className="flex flex-col space-y-8 w-full px-4 animate-in slide-in-from-right-4 duration-300">[\s\S]*?<h2 className="font-display text-2xl font-bold text-primary">방 만들기<\/h2>/, hostStr + '\n        <div className="text-center">\n          <h2 className="font-display text-2xl font-bold text-primary">방 만들기</h2>');
content = content.replace(/          <button \n            disabled=\{!nickname\.trim\(\) \|\| !password\.trim\(\) \|\| loading\}\n            onClick=\{handleCreateRoom\}\n            className="flex-\[2\] bg-primary text-primary-foreground py-4 rounded-xl font-bold disabled:opacity-50 hover:opacity-90 active:scale-\[0\.98\] transition-all flex justify-center shadow-md"\n          >\n            \{loading \? '생성 중\.\.\.' : '방 생성하기'\}\n          <\/button>\n        <\/div>\n      <\/div>/, `          <button \n            type="submit"\n            disabled={!nickname.trim() || !password.trim() || loading}\n            className="flex-[2] bg-primary text-primary-foreground py-4 rounded-xl font-bold disabled:opacity-50 hover:opacity-90 active:scale-[0.98] transition-all flex justify-center shadow-md"\n          >\n            {loading ? '생성 중...' : '방 생성하기'}\n          </button>\n        </div>\n      </form>`);

// Update JOIN mode
const joinStr = `    <form onSubmit={(e) => {
      e.preventDefault();
      handleJoinRoom();
    }} className="flex flex-col space-y-8 w-full px-4 animate-in slide-in-from-right-4 duration-300">`;
content = content.replace(/    <div className="flex flex-col space-y-8 w-full px-4 animate-in slide-in-from-right-4 duration-300">[\s\S]*?<h2 className="font-display text-2xl font-bold text-primary">방 참여하기<\/h2>/, joinStr + '\n      <div className="text-center">\n        <h2 className="font-display text-2xl font-bold text-primary">방 참여하기</h2>');
content = content.replace(/        <button \n          disabled=\{!nickname\.trim\(\) \|\| !roomCodeInput\.trim\(\) \|\| loading\}\n          onClick=\{handleJoinRoom\}\n          className="flex-\[2\] bg-primary text-primary-foreground py-4 rounded-xl font-bold disabled:opacity-50 hover:opacity-90 active:scale-\[0\.98\] transition-all flex justify-center shadow-md"\n        >\n          \{loading \? '입장 중\.\.\.' : '입장하기'\}\n        <\/button>\n      <\/div>\n    <\/div>/, `        <button \n          type="submit"\n          disabled={!nickname.trim() || !roomCodeInput.trim() || loading}\n          className="flex-[2] bg-primary text-primary-foreground py-4 rounded-xl font-bold disabled:opacity-50 hover:opacity-90 active:scale-[0.98] transition-all flex justify-center shadow-md"\n        >\n          {loading ? '입장 중...' : '입장하기'}\n        </button>\n      </div>\n    </form>`);

fs.writeFileSync('src/pages/LobbyPage.tsx', content);
