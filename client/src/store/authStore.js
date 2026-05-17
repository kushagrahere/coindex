import { create } from 'zustand';
import { api } from '../lib/api';

export const useAuthStore = create((set, get) => ({
  user:            null,
  wallets:         [],
  isAuthenticated: false,
  isLoading:       false,
  error:           null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.auth.login({ email, password });
      api.setTokens(data.accessToken, data.refreshToken);
      set({ user: data.user, isAuthenticated: true, isLoading: false });
      return true;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      return false;
    }
  },

  register: async (email, username, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.auth.register({ email, username, password });
      api.setTokens(data.accessToken, data.refreshToken);
      set({ user: data.user, isAuthenticated: true, isLoading: false });
      return true;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      return false;
    }
  },

  logout: async () => {
    try { await api.auth.logout(); } catch { /* ignore */ }
    api.clearTokens();
    set({ user: null, wallets: [], isAuthenticated: false });
  },

  fetchMe: async () => {
    if (!api.getToken()) return;
    try {
      const { data } = await api.auth.me();
      set({ user: data, wallets: data.wallets || [], isAuthenticated: true });
    } catch {
      api.clearTokens();
      set({ user: null, isAuthenticated: false });
    }
  },

  clearError: () => set({ error: null }),

  getWallet: (asset) => {
    const wallets = get().wallets;
    return wallets.find(w => w.asset === asset) || { asset, balance: 0, locked: 0 };
  },
}));
