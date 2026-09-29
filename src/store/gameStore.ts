import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type GamePhase = 'LOBBY' | 'SETUP' | 'NIGHT' | 'NIGHT_RESULT' | 'DAY' | 'VOTING' | 'END' | 'HISTORY';

interface GameState {
  roomId: string | null;
  phase: GamePhase;
  players: any[];
  isHost: boolean;
  timeLimit: number; // in seconds
  setRoomId: (id: string | null) => void;
  setPhase: (phase: GamePhase) => void;
  setHost: (isHost: boolean) => void;
  setTimeLimit: (seconds: number) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      roomId: null,
      phase: 'LOBBY',
      players: [],
      isHost: false,
      timeLimit: 300, // 5 minutes default
      setRoomId: (id) => set({ roomId: id }),
      setPhase: (phase) => set({ phase }),
      setHost: (isHost) => set({ isHost }),
      setTimeLimit: (seconds) => set({ timeLimit: seconds }),
      resetGame: () => set({ roomId: null, phase: 'LOBBY', players: [], isHost: false })
    }),
    {
      name: 'werewolf-game-session',
      partialize: (state) => ({ 
        roomId: state.roomId, 
        phase: state.phase, 
        isHost: state.isHost,
        timeLimit: state.timeLimit
      }), // players는 DB에서 실시간으로 가져오므로 저장 불필요
    }
  )
);
