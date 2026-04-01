import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORE_KEY = "smartbottle_hydration_v3";

interface PersistedState {
  activeBottleId: string | null;
  activeBottleModelId: string;
  fullWeightG: number;
  emptyWeightG: number;
  isCalibrated: boolean;

  dailyGoalMl: number;
  weeklyGoalMl: number;
  monthlyGoalMl: number;

  todayIntakeMl: number;
  lastResetDate: string;

  remindersEnabled: boolean;
  reminderIntervalHours: number;
  demoMode: boolean;
}

interface ActiveBottleData {
  id: string;
  fullWeightG: number;
  emptyWeightG: number;
  capacityMl: number;
  modelId?: string;
}

interface HydrationState extends PersistedState {
  simulatedWeightG: number | null;
  previousWeightG: number | null;
  isLoaded: boolean;

  calibrate: (fullWeight: number, emptyWeight: number) => Promise<void>;
  resetCalibration: () => Promise<void>;

  setActiveBottle: (bottle: ActiveBottleData) => Promise<void>;

  setDailyGoal: (ml: number) => Promise<void>;
  setWeeklyGoal: (ml: number) => Promise<void>;
  setMonthlyGoal: (ml: number) => Promise<void>;

  addIntake: (ml: number) => Promise<void>;
  resetDailyIntake: () => Promise<void>;
  resetAll: () => Promise<void>;

  setSimulatedWeight: (weight: number) => void;
  refillBottle: () => void;

  setReminders: (enabled: boolean) => Promise<void>;
  setReminderInterval: (hours: number) => Promise<void>;
  setDemoMode: (enabled: boolean) => Promise<void>;

  getWaterRemainingMl: (realWeightG?: number | null) => number;
  getBottleCapacityMl: () => number;
  getFillPercentage: (realWeightG?: number | null) => number;
  getStatusText: () => string;
  getDailyProgress: () => number;
  getWeeklyProgress: (weekTotalMl: number) => number;
  getMonthlyProgress: (monthTotalMl: number) => number;

  loadState: () => Promise<void>;
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
    activeBottleId: state.activeBottleId,
    activeBottleModelId: state.activeBottleModelId,
    fullWeightG: state.fullWeightG,
    emptyWeightG: state.emptyWeightG,
    isCalibrated: state.isCalibrated,
    dailyGoalMl: state.dailyGoalMl,
    weeklyGoalMl: state.weeklyGoalMl,
    monthlyGoalMl: state.monthlyGoalMl,
    todayIntakeMl: state.todayIntakeMl,
    lastResetDate: state.lastResetDate,
    remindersEnabled: state.remindersEnabled,
    reminderIntervalHours: state.reminderIntervalHours,
    demoMode: state.demoMode,
  };
}

export const useHydrationStore = create<HydrationState>((set, get) => ({
  activeBottleId: null,
  activeBottleModelId: "water-bottle",
  fullWeightG: 0,
  emptyWeightG: 0,
  isCalibrated: false,
  dailyGoalMl: 2500,
  weeklyGoalMl: 17500,
  monthlyGoalMl: 75000,
  todayIntakeMl: 0,
  lastResetDate: todayDateString(),
  remindersEnabled: true,
  reminderIntervalHours: 2,
  demoMode: false,
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

  setActiveBottle: async (bottle: ActiveBottleData) => {
    set({
      activeBottleId: bottle.id,
      fullWeightG: bottle.fullWeightG,
      emptyWeightG: bottle.emptyWeightG,
      isCalibrated: true,
      activeBottleModelId: bottle.modelId || "water-bottle",
      simulatedWeightG: bottle.fullWeightG,
      previousWeightG: bottle.fullWeightG,
    });
    await persist(getPersistedFields(get()));
  },

  setDailyGoal: async (ml: number) => {
    set({ dailyGoalMl: ml });
    await persist(getPersistedFields(get()));
  },

  setWeeklyGoal: async (ml: number) => {
    set({ weeklyGoalMl: ml });
    await persist(getPersistedFields(get()));
  },

  setMonthlyGoal: async (ml: number) => {
    set({ monthlyGoalMl: ml });
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

  resetAll: async () => {
    set({
      activeBottleId: null,
      activeBottleModelId: "water-bottle",
      fullWeightG: 0,
      emptyWeightG: 0,
      isCalibrated: false,
      dailyGoalMl: 2500,
      weeklyGoalMl: 17500,
      monthlyGoalMl: 75000,
      todayIntakeMl: 0,
      lastResetDate: todayDateString(),
      remindersEnabled: true,
      reminderIntervalHours: 2,
      demoMode: false,
      simulatedWeightG: null,
      previousWeightG: null,
    });
    await AsyncStorage.removeItem(STORE_KEY);
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

  setDemoMode: async (enabled: boolean) => {
    set({ demoMode: enabled });
    if (enabled) {
      const state = get();
      set({
        simulatedWeightG: state.fullWeightG,
        previousWeightG: state.fullWeightG,
      });
    }
    await persist(getPersistedFields(get()));
  },

  getWaterRemainingMl: (realWeightG?: number | null) => {
    const state = get();
    if (!state.isCalibrated) return 0;
    const currentWeight = state.demoMode
      ? (state.simulatedWeightG ?? state.fullWeightG)
      : (realWeightG ?? state.fullWeightG);
    return Math.max(0, Math.round(currentWeight - state.emptyWeightG));
  },

  getBottleCapacityMl: () => {
    const state = get();
    return Math.max(0, state.fullWeightG - state.emptyWeightG);
  },

  getFillPercentage: (realWeightG?: number | null) => {
    const state = get();
    const capacity = state.fullWeightG - state.emptyWeightG;
    if (capacity <= 0) return 0;
    const remaining = get().getWaterRemainingMl(realWeightG);
    return Math.min(1, Math.max(0, remaining / capacity));
  },

  getStatusText: () => {
    const state = get();
    if (state.todayIntakeMl === 0) return "Inte druckit än idag";
    if (state.todayIntakeMl >= state.dailyGoalMl) return "Dagens mål uppnått!";
    return "Nyss druckit";
  },

  getDailyProgress: () => {
    const state = get();
    if (state.dailyGoalMl <= 0) return 0;
    return Math.min(1, state.todayIntakeMl / state.dailyGoalMl);
  },

  getWeeklyProgress: (weekTotalMl: number) => {
    const state = get();
    if (state.weeklyGoalMl <= 0) return 0;
    return Math.min(1, weekTotalMl / state.weeklyGoalMl);
  },

  getMonthlyProgress: (monthTotalMl: number) => {
    const state = get();
    if (state.monthlyGoalMl <= 0) return 0;
    return Math.min(1, monthTotalMl / state.monthlyGoalMl);
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
