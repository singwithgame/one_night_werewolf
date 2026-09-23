import { create } from 'zustand';

export type GamePhase = 'LOBBY' | 'SETUP' | 'NIGHT' | 'NIGHT_RESULT' | 'DAY' | 'VOTING' | 'END';

interface GameState {
  roomId: string | null;
  phase: GamePhase;
  players: any[];
  isHost: boolean;
  timeLimit: number; // in seconds
  setRoomId: (id: string) => void;
  setPhase: (phase: GamePhase) => void;
  setHost: (isHost: boolean) => void;
  setTimeLimit: (seconds: number) => void;
}

export const useGameStore = create<GameState>((set) => ({
  roomId: null,
  phase: 'LOBBY',
  players: [],
  isHost: false,
  timeLimit: 300, // 5 minutes default
  setRoomId: (id) => set({ roomId: id }),
  setPhase: (phase) => set({ phase }),
  setHost: (isHost) => set({ isHost }),
  setTimeLimit: (seconds) => set({ timeLimit: seconds }),
}));
