import axios from 'axios';
import { useUserStore } from '../store/useUserStore';
import type { Challenge, SubmitResponse, StreakSummary, User } from '../types';

const BASE_URL = __DEV__
  ? 'http://localhost:8000'
  : 'https://api.codequest.app';   // replace with your prod domain

export const apiClient = axios.create({ baseURL: BASE_URL, timeout: 10_000 });

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
    const { data } = await apiClient.get('/challenges', { params });
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
