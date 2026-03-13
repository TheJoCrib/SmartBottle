import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "smartbottle_auth_token";

interface AuthState {
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setToken: (token: string) => Promise<void>;
  clearToken: () => Promise<void>;
  loadToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  isLoading: true,
  isAuthenticated: false,

  setToken: async (token: string) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    set({ token, isAuthenticated: true });
  },

  clearToken: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    set({ token: null, isAuthenticated: false });
  },

  loadToken: async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      set({
        token,
        isAuthenticated: !!token,
        isLoading: false,
      });
    } catch (error) {
      console.error("Error loading token:", error);
      set({ isLoading: false });
    }
  },
}));
