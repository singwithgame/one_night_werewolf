import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { getLocalUid } from '../lib/firebase';
import { createRoom, joinRoom } from '../services/roomService';

export default function LobbyPage() {
  const { setHost, setPhase, setTimeLimit, timeLimit, setRoomId } = useGameStore();
  const [nickname, setNickname] = useState('');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [mode, setMode] = useState<'SELECT' | 'HOST' | 'JOIN'>('SELECT');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateRoom = async () => {
    if (!nickname.trim()) return;
    setLoading(true);
    setError('');
    try {
      const uid = getLocalUid();
      const code = await createRoom(uid, nickname, timeLimit);
      setHost(true);
      setRoomId(code);
      setPhase('SETUP'); // 로비 대기방으로 이동 (추후 뷰 변경 필요)
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
      <div className="flex flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-2">
          <h1 className="font-display text-display-lg text-primary tracking-tight">One Night</h1>
          <p className="text-text-secondary text-body-md">Ultimate Werewolf Companion</p>
        </div>
        
        <div className="flex flex-col w-full gap-4">
          <button 
            onClick={() => { setMode('HOST'); setError(''); }}
            className="w-full bg-primary text-primary-foreground py-3 rounded-full font-medium tracking-wide hover:opacity-90 transition-opacity"
          >
            방 만들기 (Host)
          </button>
          <button 
            onClick={() => { setMode('JOIN'); setError(''); }}
            className="w-full bg-transparent border border-border text-foreground py-3 rounded-full font-medium tracking-wide hover:bg-muted transition-colors"
          >
            참여하기 (Join)
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'HOST') {
    return (
      <div className="flex flex-col space-y-6 w-full animate-in slide-in-from-right-4 duration-300">
        <h2 className="font-display text-display-sm text-primary">방 만들기</h2>
        
        {error && <p className="text-destructive text-sm">{error}</p>}

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-caption-uppercase text-text-tertiary font-semibold tracking-wider">낮 페이즈 타이머 (분)</label>
            <div className="flex gap-2">
              {[3, 5, 10].map(min => (
                <button
                  key={min}
                  onClick={() => setTimeLimit(min * 60)}
                  className={`flex-1 py-2 rounded-lg border transition-colors ${
                    timeLimit === min * 60 
                    ? 'bg-primary text-primary-foreground border-primary' 
                    : 'bg-card text-foreground border-border hover:bg-muted'
                  }`}
                >
                  {min}분
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-caption-uppercase text-text-tertiary font-semibold tracking-wider">내 닉네임</label>
            <input 
              type="text" 
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full bg-input-background border border-border rounded-md px-4 py-3 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="방장 닉네임 입력"
            />
          </div>
        </div>

        <div className="pt-4 flex gap-3">
          <button 
            onClick={() => setMode('SELECT')}
            className="flex-1 border border-border py-3 rounded-full font-medium"
          >
            뒤로
          </button>
          <button 
            disabled={!nickname.trim() || loading}
            onClick={handleCreateRoom}
            className="flex-[2] bg-primary text-primary-foreground py-3 rounded-full font-medium disabled:opacity-50 flex justify-center"
          >
            {loading ? '생성 중...' : '방 생성'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6 w-full animate-in slide-in-from-right-4 duration-300">
      <h2 className="font-display text-display-sm text-primary">방 참여하기</h2>
      
      {error && <p className="text-destructive text-sm">{error}</p>}

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-caption-uppercase text-text-tertiary font-semibold tracking-wider">입장 코드</label>
          <input 
            type="text" 
            value={roomCodeInput}
            onChange={(e) => setRoomCodeInput(e.target.value)}
            className="w-full bg-input-background border border-border rounded-md px-4 py-3 text-foreground font-display text-center text-display-sm tracking-widest focus:outline-none focus:ring-1 focus:ring-ring uppercase"
            placeholder="ABCD"
            maxLength={4}
          />
        </div>
        <div className="space-y-2">
          <label className="text-caption-uppercase text-text-tertiary font-semibold tracking-wider">내 닉네임</label>
          <input 
            type="text" 
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full bg-input-background border border-border rounded-md px-4 py-3 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="닉네임 입력"
          />
        </div>
      </div>

      <div className="pt-4 flex gap-3">
        <button 
          onClick={() => setMode('SELECT')}
          className="flex-1 border border-border py-3 rounded-full font-medium"
        >
          뒤로
        </button>
        <button 
          disabled={!nickname.trim() || !roomCodeInput.trim() || loading}
          onClick={handleJoinRoom}
          className="flex-[2] bg-primary text-primary-foreground py-3 rounded-full font-medium disabled:opacity-50 flex justify-center"
        >
          {loading ? '입장 중...' : '입장'}
        </button>
      </div>
    </div>
  );
}
