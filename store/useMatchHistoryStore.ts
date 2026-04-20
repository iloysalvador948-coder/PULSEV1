import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MatchHistoryItem, RoundResult } from '../types';
import { STORAGE_KEYS } from '../utils/constants';

interface MatchHistoryState {
  history: MatchHistoryItem[];
  addMatch: (
    opponent: string,
    playerScore: number,
    opponentScore: number,
    isWin: boolean,
    eloChange: number,
    rounds: RoundResult[]
  ) => void;
  clearHistory: () => void;
}

export const useMatchHistoryStore = create<MatchHistoryState>()(
  persist(
    (set) => ({
      history: [],
      addMatch: (opponent, playerScore, opponentScore, isWin, eloChange, rounds) =>
        set((state) => {
          const newMatch: MatchHistoryItem = {
            id: `match_${Date.now()}`,
            date: new Date().toISOString(),
            opponent,
            playerScore,
            opponentScore,
            isWin,
            eloChange,
            rounds,
          };
          const updatedHistory = [newMatch, ...state.history].slice(0, 10);
          return { history: updatedHistory };
        }),
      clearHistory: () => set({ history: [] }),
    }),
    {
      name: STORAGE_KEYS.matchHistory,
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);