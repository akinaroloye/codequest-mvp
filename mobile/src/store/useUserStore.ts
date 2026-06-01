import { create } from 'zustand';
import { MMKV } from 'react-native-mmkv';
import type { User } from '../types';

const storage = new MMKV({ id: 'codequest-user' });

interface UserStore {
  token: string | null;
  user: User | null;
  setToken: (token: string) => void;
  setUser: (user: User) => void;
  patchUser: (patch: Partial<User>) => void;
  logout: () => void;
}

const loadToken = () => storage.getString('token') ?? null;
const loadUser = (): User | null => {
  const raw = storage.getString('user');
  return raw ? (JSON.parse(raw) as User) : null;
};

export const useUserStore = create<UserStore>((set) => ({
  token: loadToken(),
  user: loadUser(),

  setToken: (token) => {
    storage.set('token', token);
    set({ token });
  },

  setUser: (user) => {
    storage.set('user', JSON.stringify(user));
    set({ user });
  },

  patchUser: (patch) =>
    set((state) => {
      if (!state.user) return state;
      const updated = { ...state.user, ...patch };
      storage.set('user', JSON.stringify(updated));
      return { user: updated };
    }),

  logout: () => {
    storage.delete('token');
    storage.delete('user');
    set({ token: null, user: null });
  },
}));
