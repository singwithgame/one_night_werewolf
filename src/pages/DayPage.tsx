import { useState, useEffect } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { db } from '../lib/firebase';
import { useGameStore } from '../store/gameStore';

export default function DayPage() {
  const { roomId, isHost } = useGameStore();
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [timeLimit, setTimeLimit] = useState<number>(300);

  useEffect(() => {
    if (!roomId) return;
    
    // 방 정보(타이머 설정값 및 시작 시간) 가져오기
    const infoRef = ref(db, `rooms/${roomId}/info`);
    const unsubscribe = onValue(infoRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        setTimeLimit(data.timeLimit || 300);
        
        // 낮이 시작된 시간
        if (data.dayStartTime) {
          const limitMs = (data.timeLimit || 300) * 1000;
          const endTime = data.dayStartTime + limitMs;
          
          const updateTimer = () => {
            const now = Date.now();
            const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
            setTimeLeft(remaining);
            
            // 시간이 0이 되면 자동으로 투표 페이즈로 이동 (방장만 트리거)
            if (remaining <= 0 && isHost && data.phase === 'DAY') {
              update(ref(db, `rooms/${roomId}/info`), { phase: 'VOTING' });
            }
          };
          
          updateTimer(); // 즉시 1회 실행
          const interval = setInterval(updateTimer, 1000);
          return () => clearInterval(interval);
        }
      }
    });

    return () => unsubscribe();
  }, [roomId, isHost]);

  const handleSkipToVoting = async () => {
    if (!roomId || !isHost) return;
    await update(ref(db, `rooms/${roomId}/info`), { phase: 'VOTING' });
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-700 w-full text-center">
      <div className="space-y-2">
        <h1 className="font-display text-display-lg text-primary tracking-tight">Day Phase</h1>
        <p className="text-body-md text-text-secondary">누가 늑대인간인지 토론하세요!</p>
      </div>

      {/* 타이머 영역 */}
      <div className="w-full bg-surface-card border border-border rounded-xl p-8 shadow-sm flex items-center justify-center">
        <div className={`font-display text-[5rem] font-light tracking-tighter ${timeLeft <= 30 ? 'text-destructive animate-pulse' : 'text-foreground'}`}>
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-text-tertiary text-sm">
          자신의 원래 역할을 발설해도 되지만, 진실인지 거짓인지는 아무도 모릅니다.
        </p>
        
        {isHost && (
          <button 
            onClick={handleSkipToVoting}
            className="w-full mt-4 px-6 py-4 bg-primary text-primary-foreground rounded-full font-medium tracking-wide hover:opacity-90 transition-opacity"
          >
            토론 종료 및 투표로 넘어가기
          </button>
        )}
      </div>
    </div>
  );
}
