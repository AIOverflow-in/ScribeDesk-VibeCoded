"use client";
import { create } from "zustand";
import { Doctor } from "../types";
import { setTokens, clearTokens, getRefreshToken } from "../api/client";
import * as authApi from "../api/auth";

interface AuthState {
  user: Doctor | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,

  login: async (email, password) => {
    const data = await authApi.login(email, password);
    setTokens(data.access_token, data.refresh_token);
    set({ user: data.user });
  },

  logout: async () => {
    const rt = getRefreshToken();
    if (rt) {
      try { await authApi.logout(rt); } catch {}
    }
    clearTokens();
    set({ user: null });
  },

  loadUser: async () => {
    set({ isLoading: true });
    try {
      const user = await authApi.getMe();
      set({ user, isLoading: false });
    } catch {
      set({ user: null, isLoading: false });
    }
  },
}));
