import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

type ThemeMode = "light" | "dark" | "system";

interface NotificationSettings {
  scheduledReminders: boolean;
  reminderIntervalHours: number;
  smartReminders: boolean;
  goalAlerts: boolean;
  motivationalMessages: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
}

interface SettingsState {
  theme: ThemeMode;
  notifications: NotificationSettings;
  minimalSocialMode: boolean;
  units: "metric" | "imperial";
  isLoading: boolean;

  setTheme: (theme: ThemeMode) => Promise<void>;
  setNotifications: (settings: Partial<NotificationSettings>) => Promise<void>;
  setMinimalSocialMode: (enabled: boolean) => Promise<void>;
  setUnits: (units: "metric" | "imperial") => Promise<void>;
  loadSettings: () => Promise<void>;
}

const SETTINGS_KEY = "smartbottle_settings";

const defaultNotifications: NotificationSettings = {
  scheduledReminders: true,
  reminderIntervalHours: 2,
  smartReminders: true,
  goalAlerts: true,
  motivationalMessages: true,
  quietHoursStart: null,
  quietHoursEnd: null,
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  theme: "system",
  notifications: defaultNotifications,
  minimalSocialMode: false,
  units: "metric",
  isLoading: true,

  setTheme: async (theme: ThemeMode) => {
    set({ theme });
    await saveSettings(get());
  },

  setNotifications: async (settings: Partial<NotificationSettings>) => {
    const newNotifications = { ...get().notifications, ...settings };
    set({ notifications: newNotifications });
    await saveSettings(get());
  },

  setMinimalSocialMode: async (enabled: boolean) => {
    set({ minimalSocialMode: enabled });
    await saveSettings(get());
  },

  setUnits: async (units: "metric" | "imperial") => {
    set({ units });
    await saveSettings(get());
  },

  loadSettings: async () => {
    try {
      const data = await AsyncStorage.getItem(SETTINGS_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        set({
          theme: parsed.theme || "system",
          notifications: { ...defaultNotifications, ...parsed.notifications },
          minimalSocialMode: parsed.minimalSocialMode || false,
          units: parsed.units || "metric",
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      set({ isLoading: false });
    }
  },
}));

async function saveSettings(state: SettingsState) {
  try {
    const { isLoading, ...settings } = state;
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("Error saving settings:", error);
  }
}
