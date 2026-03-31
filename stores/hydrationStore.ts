import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORE_KEY = "smartbottle_hydration_v2";

interface PersistedState {
  fullWeightG: number;
  emptyWeightG: number;
  isCalibrated: boolean;
  dailyGoalMl: number;
  todayIntakeMl: number;
  lastResetDate: string;
  remindersEnabled: boolean;
  reminderIntervalHours: number;
}

interface HydrationState extends PersistedState {
  simulatedWeightG: number | null;
  previousWeightG: number | null;
  isLoaded: boolean;

  calibrate: (fullWeight: number, emptyWeight: number) => Promise<void>;
  resetCalibration: () => Promise<void>;
  setDailyGoal: (ml: number) => Promise<void>;
  addIntake: (ml: number) => Promise<void>;
  resetDailyIntake: () => Promise<void>;
  setSimulatedWeight: (weight: number) => void;
  refillBottle: () => void;
  setReminders: (enabled: boolean) => Promise<void>;
  setReminderInterval: (hours: number) => Promise<void>;
  loadState: () => Promise<void>;
  getWaterRemainingMl: () => number;
  getBottleCapacityMl: () => number;
  getStatusText: () => string;
}

function todayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

async function persist(state: PersistedState) {
  try {
    await AsyncStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to persist hydration state:", e);
  }
}

function getPersistedFields(state: HydrationState): PersistedState {
  return {
    fullWeightG: state.fullWeightG,
    emptyWeightG: state.emptyWeightG,
    isCalibrated: state.isCalibrated,
    dailyGoalMl: state.dailyGoalMl,
    todayIntakeMl: state.todayIntakeMl,
    lastResetDate: state.lastResetDate,
    remindersEnabled: state.remindersEnabled,
    reminderIntervalHours: state.reminderIntervalHours,
  };
}

export const useHydrationStore = create<HydrationState>((set, get) => ({
  fullWeightG: 0,
  emptyWeightG: 0,
  isCalibrated: false,
  dailyGoalMl: 2500,
  todayIntakeMl: 0,
  lastResetDate: todayDateString(),
  remindersEnabled: true,
  reminderIntervalHours: 2,
  simulatedWeightG: null,
  previousWeightG: null,
  isLoaded: false,

  calibrate: async (fullWeight: number, emptyWeight: number) => {
    set({
      fullWeightG: fullWeight,
      emptyWeightG: emptyWeight,
      isCalibrated: true,
      simulatedWeightG: fullWeight,
      previousWeightG: fullWeight,
    });
    await persist(getPersistedFields(get()));
  },

  resetCalibration: async () => {
    set({
      fullWeightG: 0,
      emptyWeightG: 0,
      isCalibrated: false,
      simulatedWeightG: null,
      previousWeightG: null,
    });
    await persist(getPersistedFields(get()));
  },

  setDailyGoal: async (ml: number) => {
    set({ dailyGoalMl: ml });
    await persist(getPersistedFields(get()));
  },

  addIntake: async (ml: number) => {
    const current = get().todayIntakeMl;
    set({ todayIntakeMl: current + ml });
    await persist(getPersistedFields(get()));
  },

  resetDailyIntake: async () => {
    set({ todayIntakeMl: 0 });
    await persist(getPersistedFields(get()));
  },

  setSimulatedWeight: (weight: number) => {
    const state = get();
    const prev = state.simulatedWeightG ?? state.fullWeightG;
    const prevWater = Math.max(0, prev - state.emptyWeightG);
    const newWater = Math.max(0, weight - state.emptyWeightG);
    const consumed = prevWater - newWater;

    if (consumed > 0) {
      const newIntake = state.todayIntakeMl + consumed;
      set({
        simulatedWeightG: weight,
        previousWeightG: weight,
        todayIntakeMl: newIntake,
      });
      persist(getPersistedFields(get()));
    } else {
      set({
        simulatedWeightG: weight,
        previousWeightG: weight,
      });
    }
  },

  refillBottle: () => {
    const state = get();
    set({
      simulatedWeightG: state.fullWeightG,
      previousWeightG: state.fullWeightG,
    });
  },

  setReminders: async (enabled: boolean) => {
    set({ remindersEnabled: enabled });
    await persist(getPersistedFields(get()));
  },

  setReminderInterval: async (hours: number) => {
    set({ reminderIntervalHours: hours });
    await persist(getPersistedFields(get()));
  },

  getWaterRemainingMl: () => {
    const state = get();
    if (!state.isCalibrated) return 0;
    const currentWeight = state.simulatedWeightG ?? state.fullWeightG;
    return Math.max(0, Math.round(currentWeight - state.emptyWeightG));
  },

  getBottleCapacityMl: () => {
    const state = get();
    return Math.max(0, state.fullWeightG - state.emptyWeightG);
  },

  getStatusText: () => {
    const state = get();
    if (state.todayIntakeMl === 0) return "Inte druckit \u00e4n idag";
    if (state.todayIntakeMl >= state.dailyGoalMl) return "Dagens m\u00e5l uppn\u00e5tt!";
    return "Nyss druckit";
  },

  loadState: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORE_KEY);
      if (raw) {
        const data: PersistedState = JSON.parse(raw);
        const today = todayDateString();
        const needsReset = data.lastResetDate !== today;

        set({
          ...data,
          todayIntakeMl: needsReset ? 0 : data.todayIntakeMl,
          lastResetDate: today,
          simulatedWeightG: data.isCalibrated ? data.fullWeightG : null,
          previousWeightG: data.isCalibrated ? data.fullWeightG : null,
          isLoaded: true,
        });

        if (needsReset) {
          await persist(getPersistedFields(get()));
        }
      } else {
        set({ isLoaded: true });
      }
    } catch (e) {
      console.error("Failed to load hydration state:", e);
      set({ isLoaded: true });
    }
  },
}));
