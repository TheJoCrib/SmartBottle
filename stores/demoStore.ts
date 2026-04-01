import { create } from "zustand";

interface DemoState {
  simulatedWeight: number;
  isSimulating: boolean;
  demoIntakeMl: number;
  emptyWeightG: number;
  setWeight: (g: number) => void;
  refill: (fullWeightG: number) => void;
  startSimulation: (fullWeightG: number, emptyWeightG: number) => void;
  stopSimulation: () => void;
  getDemoIntake: () => number;
}

export const useDemoStore = create<DemoState>((set, get) => ({
  simulatedWeight: 0,
  isSimulating: false,
  demoIntakeMl: 0,
  emptyWeightG: 0,

  setWeight: (g) => {
    const state = get();
    const prev = state.simulatedWeight;
    const prevWater = Math.max(0, prev - state.emptyWeightG);
    const newWater = Math.max(0, g - state.emptyWeightG);
    const consumed = prevWater - newWater;

    if (consumed > 0) {
      set({ simulatedWeight: g, demoIntakeMl: state.demoIntakeMl + consumed });
    } else {
      set({ simulatedWeight: g });
    }
  },

  refill: (fullWeightG) => set({ simulatedWeight: fullWeightG }),

  startSimulation: (fullWeightG, emptyWeightG) => set({
    simulatedWeight: fullWeightG,
    isSimulating: true,
    demoIntakeMl: 0,
    emptyWeightG,
  }),

  stopSimulation: () => set({ isSimulating: false, demoIntakeMl: 0 }),

  getDemoIntake: () => get().demoIntakeMl,
}));
