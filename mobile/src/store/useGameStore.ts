/**
 * Game Store — ephemeral in-session state for the active challenge.
 * Persisted user progression lives in useUserStore.
 */
import { create } from 'zustand';
import type { Challenge } from '../types';

interface ActiveSession {
  challenge: Challenge;
  startedAt: number;       // Date.now()
  heartsUsed: number;
  answers: Record<string, unknown>;
  submitted: boolean;
}

interface GameStore {
  session: ActiveSession | null;
  startSession: (challenge: Challenge) => void;
  recordAnswer: (key: string, value: unknown) => void;
  loseHeart: () => void;
  markSubmitted: () => void;
  clearSession: () => void;

  // In-memory XP animation queue
  pendingXPBurst: number;
  triggerXPBurst: (xp: number) => void;
  clearXPBurst: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  session: null,
  pendingXPBurst: 0,

  startSession: (challenge) =>
    set({
      session: {
        challenge,
        startedAt: Date.now(),
        heartsUsed: 0,
        answers: {},
        submitted: false,
      },
    }),

  recordAnswer: (key, value) =>
    set((state) => ({
      session: state.session
        ? { ...state.session, answers: { ...state.session.answers, [key]: value } }
        : null,
    })),

  loseHeart: () =>
    set((state) => ({
      session: state.session
        ? { ...state.session, heartsUsed: state.session.heartsUsed + 1 }
        : null,
    })),

  markSubmitted: () =>
    set((state) => ({
      session: state.session ? { ...state.session, submitted: true } : null,
    })),

  clearSession: () => set({ session: null }),

  triggerXPBurst: (xp) => set({ pendingXPBurst: xp }),
  clearXPBurst: () => set({ pendingXPBurst: 0 }),
}));
