import { create } from "zustand";

interface BottleState {
  currentWeight: number | null;
  isConnected: boolean;
  connectedDeviceId: string | null;
  isMeasuringDrink: boolean;
  setWeight: (weight: number) => void;
  setConnected: (connected: boolean, deviceId?: string) => void;
  setMeasuringDrink: (value: boolean) => void;
  disconnect: () => void;
}

export const useBottleStore = create<BottleState>((set) => ({
  currentWeight: null,
  isConnected: false,
  connectedDeviceId: null,
  isMeasuringDrink: false,

  setWeight: (weight: number) => {
    set({ currentWeight: weight });
  },

  setConnected: (connected: boolean, deviceId?: string) => {
    set({
      isConnected: connected,
      connectedDeviceId: connected ? deviceId || null : null,
    });
  },

  setMeasuringDrink: (value: boolean) => {
    set((s) => (s.isMeasuringDrink === value ? s : { isMeasuringDrink: value }));
  },

  disconnect: () => {
    set({
      isConnected: false,
      connectedDeviceId: null,
      currentWeight: null,
      isMeasuringDrink: false,
    });
  },
}));
