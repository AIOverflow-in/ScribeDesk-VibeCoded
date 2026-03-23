"use client";
import { create } from "zustand";

interface UIState {
  sidebarOpen: boolean;
  chatOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  setChatOpen: (v: boolean) => void;
  toggleChat: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  chatOpen: false,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setChatOpen: (chatOpen) => set({ chatOpen }),
  toggleChat: () => set((s) => ({ chatOpen: !s.chatOpen })),
}));
