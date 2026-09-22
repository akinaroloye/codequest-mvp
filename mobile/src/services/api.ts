import axios from 'axios';
import { useUserStore } from '../store/useUserStore';
import type { Challenge, SubmitResponse, StreakSummary } from '../types';

declare const __DEV__: boolean;

const BASE_URL = __DEV__
  ? 'https://real-ads-drive.loca.lt'
  : 'https://api.codequest.app';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10_000,
  headers: { 'bypass-tunnel-reminder': 'true' },
});

apiClient.interceptors.request.use((config) => {
  const token = useUserStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  register: async (email: string, username: string, password: string) => {
    const { data } = await apiClient.post<{ access_token: string }>('/auth/register', {
      email, username, password,
    });
    return data.access_token;
  },

  login: async (email: string, password: string) => {
    const form = new URLSearchParams({ username: email, password });
    const { data } = await apiClient.post<{ access_token: string }>(
      '/auth/token', form.toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    return data.access_token;
  },

  me: async () => {
    const { data } = await apiClient.get('/auth/me');
    return data;
  },
};

// ─── Challenges ───────────────────────────────────────────────────────────────

export const challengeApi = {
  getDaily: async (): Promise<Challenge> => {
    const { data } = await apiClient.get('/challenges/daily');
    return data;
  },

  list: async (params?: {
    language?: string;
    difficulty?: string;
    type?: string;
    limit?: number;
    offset?: number;
  }): Promise<Challenge[]> => {
    const { data } = await apiClient.get('/challenges/', { params });
    return data;
  },

  get: async (id: string): Promise<Challenge> => {
    const { data } = await apiClient.get(`/challenges/${id}`);
    return data;
  },
};

// ─── Progress ─────────────────────────────────────────────────────────────────

export const progressApi = {
  submit: async (payload: {
    challengeId: string;
    submission: Record<string, unknown>;
    timeTakenMs: number;
  }): Promise<SubmitResponse> => {
    const { data } = await apiClient.post('/progress/submit', {
      challenge_id: payload.challengeId,
      submission: payload.submission,
      time_taken_ms: payload.timeTakenMs,
    });
    return data;
  },
};

// ─── Leaderboard ──────────────────────────────────────────────────────────────

export const leaderboardApi = {
  getTop: async () => {
    const { data } = await apiClient.get('/leaderboard/top');
    return data as Array<{
      rank: number; userId: string; username: string;
      xpTotal: number; level: number; streakCurrent: number; isMe: boolean;
    }>;
  },
};

// ─── Streak ───────────────────────────────────────────────────────────────────

export const streakApi = {
  getMyStreak: async (): Promise<StreakSummary> => {
    const { data } = await apiClient.get('/streak/me');
    return data;
  },

  purchaseShield: async () => {
    const { data } = await apiClient.post('/streak/purchase-shield');
    return data;
  },
};
