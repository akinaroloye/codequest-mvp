import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '../types';

const TOKEN_KEY = 'cq_token';
const USER_KEY = 'cq_user';

interface UserStore {
  token: string | null;
  user: User | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setToken: (token: string) => void;
  setUser: (user: User) => void;
  patchUser: (patch: Partial<User>) => void;
  logout: () => void;
}

export const useUserStore = create<UserStore>((set, get) => ({
  token: null,
  user: null,
  hydrated: false,

  hydrate: async () => {
    const [token, userRaw] = await Promise.all([
      AsyncStorage.getItem(TOKEN_KEY),
      AsyncStorage.getItem(USER_KEY),
    ]);
    set({
      token: token ?? null,
      user: userRaw ? (JSON.parse(userRaw) as User) : null,
      hydrated: true,
    });
  },

  setToken: (token) => {
    AsyncStorage.setItem(TOKEN_KEY, token);
    set({ token });
  },

  setUser: (user) => {
    AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ user });
  },

  patchUser: (patch) => {
    const current = get().user;
    if (!current) return;
    const updated = { ...current, ...patch };
    AsyncStorage.setItem(USER_KEY, JSON.stringify(updated));
    set({ user: updated });
  },

  logout: () => {
    AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    set({ token: null, user: null });
  },
}));
