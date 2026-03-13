import { create } from "zustand";

interface BottleState {
  currentWeight: number | null;
  isConnected: boolean;
  connectedDeviceId: string | null;
  batteryLevel: number | null;
  setWeight: (weight: number) => void;
  setConnected: (connected: boolean, deviceId?: string) => void;
  setBatteryLevel: (level: number) => void;
  disconnect: () => void;
}

export const useBottleStore = create<BottleState>((set) => ({
  currentWeight: null,
  isConnected: false,
  connectedDeviceId: null,
  batteryLevel: null,

  setWeight: (weight: number) => {
    set({ currentWeight: weight });
  },

  setConnected: (connected: boolean, deviceId?: string) => {
    set({
      isConnected: connected,
      connectedDeviceId: connected ? deviceId || null : null,
    });
  },

  setBatteryLevel: (level: number) => {
    set({ batteryLevel: level });
  },

  disconnect: () => {
    set({
      isConnected: false,
      connectedDeviceId: null,
      currentWeight: null,
      batteryLevel: null,
    });
  },
}));
