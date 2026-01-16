import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/services/api';

interface Plan {
  id: string;
  name: string;
  displayName: string;
  storeLimit: number;
}

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  plan?: Plan;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (email: string, name: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<boolean>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
          isLoading: false,
        }),

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      login: async (email, password, rememberMe = false) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/login', {
            email,
            password,
            rememberMe,
          });
          const { user, accessToken, refreshToken } = response.data;
          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          const message = error.response?.data?.message || 'Giriş başarısız';
          set({ isLoading: false, error: message });
          throw new Error(message);
        }
      },

      register: async (email, name, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/register', {
            email,
            name,
            password,
          });
          const { user, accessToken, refreshToken } = response.data;
          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          const message = error.response?.data?.message || 'Kayıt başarısız';
          set({ isLoading: false, error: message });
          throw new Error(message);
        }
      },

      logout: async () => {
        const { refreshToken } = get();
        try {
          if (refreshToken) {
            await api.post('/auth/logout', { refreshToken });
          }
        } catch (error) {
          // Ignore logout errors
        }
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      refreshTokens: async () => {
        const { refreshToken } = get();
        if (!refreshToken) return false;

        try {
          const response = await api.post('/auth/refresh', { refreshToken });
          const { user, accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;
          set({
            user,
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            isAuthenticated: true,
          });
          return true;
        } catch (error) {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
          });
          return false;
        }
      },

      checkAuth: async () => {
        const { accessToken, refreshTokens } = get();
        set({ isLoading: true });

        if (!accessToken) {
          set({ isLoading: false });
          return;
        }

        try {
          const response = await api.get('/auth/me');
          set({ user: response.data, isAuthenticated: true, isLoading: false });
        } catch (error) {
          // Try to refresh token
          const refreshed = await refreshTokens();
          if (!refreshed) {
            set({ isLoading: false });
          }
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);
