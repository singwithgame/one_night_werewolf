import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { getLocalUid } from '../lib/firebase';
import { createRoom, joinRoom } from '../services/roomService';

export default function LobbyPage() {
  const { setHost, setPhase, setTimeLimit, timeLimit, setRoomId } = useGameStore();
  const [nickname, setNickname] = useState('');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [mode, setMode] = useState<'SELECT' | 'HOST' | 'JOIN' | 'HISTORY'>('SELECT');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [password, setPassword] = useState(''); // 방 만들기 및 기록조회용 비밀번호

  const handleCreateRoom = async () => {
    if (!nickname.trim()) return;
    if (password !== import.meta.env.VITE_ADMIN_PASSWORD) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const uid = getLocalUid();
      const code = await createRoom(uid, nickname, timeLimit);
      setHost(true);
      setRoomId(code);
      setPhase('SETUP'); // 로비 대기방으로 이동
    } catch (err: any) {
      setError(err.message || '방 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!nickname.trim() || !roomCodeInput.trim()) return;
    setLoading(true);
    setError('');
    try {
      const uid = getLocalUid();
      await joinRoom(roomCodeInput, uid, nickname);
      setHost(false);
      setRoomId(roomCodeInput.toUpperCase());
      setPhase('SETUP'); // 로비 대기방으로 이동
    } catch (err: any) {
      setError(err.message || '방 입장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'SELECT') {
    return (
      <div className="flex flex-col items-center justify-center space-y-12 animate-in fade-in zoom-in duration-500 w-full px-4">
        <div className="text-center space-y-3">
          <h1 className="font-display text-display-xl text-primary tracking-tight">One Night</h1>
          <p className="text-text-secondary text-body-lg">Ultimate Werewolf</p>
        </div>
        
        <div className="flex flex-col w-full gap-4 max-w-sm">
          <button 
            onClick={() => { setMode('HOST'); setError(''); setPassword(''); }}
            className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold tracking-wide hover:opacity-90 active:scale-95 transition-all shadow-lg"
          >
            새로운 방 만들기 (Host)
          </button>
          <button 
            onClick={() => { setMode('JOIN'); setError(''); }}
            className="w-full bg-surface-card border-2 border-border text-foreground py-4 rounded-xl font-bold tracking-wide hover:border-primary/50 hover:bg-primary/5 active:scale-95 transition-all shadow-md"
          >
            기존 방에 참여하기 (Join)
          </button>
          <button 
            onClick={() => { setMode('HISTORY'); setError(''); setPassword(''); }}
            className="w-full mt-2 text-text-tertiary underline hover:text-primary transition-colors text-sm"
          >
            과거 게임 기록 조회
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'HISTORY') {
    return (
      <div className="flex flex-col space-y-8 w-full px-4 animate-in slide-in-from-right-4 duration-300">
        <div className="text-center">
          <h2 className="font-display text-display-sm text-primary">기록 조회</h2>
          <p className="text-sm text-text-secondary mt-1">과거 게임 기록을 열람하기 위한 관리자 비밀번호를 입력하세요.</p>
        </div>
        
        {error && <p className="text-destructive text-sm text-center bg-destructive/10 py-2 rounded-lg">{error}</p>}

        <div className="space-y-3">
          <label className="text-caption-uppercase text-text-tertiary font-semibold tracking-wider">비밀번호</label>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-input-background border-2 border-border rounded-xl px-5 py-4 text-foreground font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            placeholder="비밀번호 입력"
          />
        </div>

        <div className="pt-4 flex gap-3">
          <button 
            onClick={() => setMode('SELECT')}
            className="flex-1 border-2 border-border py-4 rounded-xl font-medium hover:bg-muted active:scale-95 transition-all"
          >
            뒤로가기
          </button>
          <button 
            onClick={() => {
              if (password === import.meta.env.VITE_ADMIN_PASSWORD) {
                setPhase('HISTORY');
              } else {
                setError('비밀번호가 일치하지 않습니다.');
              }
            }}
            className="flex-[2] bg-primary text-primary-foreground py-4 rounded-xl font-bold hover:opacity-90 active:scale-[0.98] transition-all flex justify-center shadow-md"
          >
            기록 열람하기
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'HOST') {
    return (
      <div className="flex flex-col space-y-8 w-full px-4 animate-in slide-in-from-right-4 duration-300">
        <div className="text-center">
          <h2 className="font-display text-display-sm text-primary">방 만들기</h2>
          <p className="text-sm text-text-secondary mt-1">게임 설정을 선택하고 이름을 입력하세요.</p>
        </div>
        
        {error && <p className="text-destructive text-sm text-center bg-destructive/10 py-2 rounded-lg">{error}</p>}

        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-caption-uppercase text-text-tertiary font-semibold tracking-wider">낮 페이즈 타이머</label>
            <div className="grid grid-cols-3 gap-3">
              {[3, 5, 10].map(min => (
                <button
                  key={min}
                  onClick={() => setTimeLimit(min * 60)}
                  className={`py-3 rounded-xl border-2 font-medium transition-all active:scale-95 ${
                    timeLimit === min * 60 
                    ? 'bg-primary/10 text-primary border-primary shadow-sm' 
                    : 'bg-card text-text-secondary border-border hover:border-primary/50 hover:text-foreground'
                  }`}
                >
                  {min}분
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-3">
            <label className="text-caption-uppercase text-text-tertiary font-semibold tracking-wider">나의 닉네임</label>
            <input 
              type="text" 
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full bg-input-background border-2 border-border rounded-xl px-5 py-4 text-foreground font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              placeholder="방장 닉네임 입력"
            />
          </div>

          <div className="space-y-3">
            <label className="text-caption-uppercase text-text-tertiary font-semibold tracking-wider">방장 비밀번호</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-input-background border-2 border-border rounded-xl px-5 py-4 text-foreground font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              placeholder="관리자 비밀번호 입력"
            />
          </div>
        </div>

        <div className="pt-4 flex gap-3">
          <button 
            onClick={() => setMode('SELECT')}
            className="flex-1 border-2 border-border py-4 rounded-xl font-medium hover:bg-muted active:scale-95 transition-all"
          >
            뒤로가기
          </button>
          <button 
            disabled={!nickname.trim() || !password.trim() || loading}
            onClick={handleCreateRoom}
            className="flex-[2] bg-primary text-primary-foreground py-4 rounded-xl font-bold disabled:opacity-50 hover:opacity-90 active:scale-[0.98] transition-all flex justify-center shadow-md"
          >
            {loading ? '생성 중...' : '방 생성하기'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-8 w-full px-4 animate-in slide-in-from-right-4 duration-300">
      <div className="text-center">
        <h2 className="font-display text-display-sm text-primary">방 참여하기</h2>
        <p className="text-sm text-text-secondary mt-1">초대받은 4자리 코드와 이름을 입력하세요.</p>
      </div>
      
      {error && <p className="text-destructive text-sm text-center bg-destructive/10 py-2 rounded-lg">{error}</p>}

      <div className="space-y-6">
        <div className="space-y-3">
          <label className="text-caption-uppercase text-text-tertiary font-semibold tracking-wider">입장 코드</label>
          <input 
            type="text" 
            value={roomCodeInput}
            onChange={(e) => setRoomCodeInput(e.target.value)}
            className="w-full bg-input-background border-2 border-border rounded-xl px-5 py-4 text-primary font-display text-center text-display-sm tracking-[0.5em] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary uppercase transition-colors"
            placeholder="ABCD"
            maxLength={4}
          />
        </div>
        <div className="space-y-3">
          <label className="text-caption-uppercase text-text-tertiary font-semibold tracking-wider">나의 닉네임</label>
          <input 
            type="text" 
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full bg-input-background border-2 border-border rounded-xl px-5 py-4 text-foreground font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            placeholder="사용할 닉네임 입력"
          />
        </div>
      </div>

      <div className="pt-4 flex gap-3">
        <button 
          onClick={() => setMode('SELECT')}
          className="flex-1 border-2 border-border py-4 rounded-xl font-medium hover:bg-muted active:scale-95 transition-all"
        >
          뒤로가기
        </button>
        <button 
          disabled={!nickname.trim() || !roomCodeInput.trim() || loading}
          onClick={handleJoinRoom}
          className="flex-[2] bg-primary text-primary-foreground py-4 rounded-xl font-bold disabled:opacity-50 hover:opacity-90 active:scale-[0.98] transition-all flex justify-center shadow-md"
        >
          {loading ? '입장 중...' : '입장하기'}
        </button>
      </div>
    </div>
  );
}
