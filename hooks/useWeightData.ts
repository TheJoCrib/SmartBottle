import { useHydrationStore } from "../stores/hydrationStore";
import { useBottleStore } from "../stores/bottleStore";
import { useDemoStore } from "../stores/demoStore";

export interface WeightData {
  currentWeight: number | null;
  isConnected: boolean;
  lastKnownWeight: number | null;
  bottleState: "on_scale" | "off_scale" | "disconnected";
  batteryLevel: number | null;
  waterRemainingMl: number;
  bottleCapacityMl: number;
  fillPercentage: number;
  todayIntakeMl: number;
}

const WEIGHT_THRESHOLD_G = 5;

export function useWeightData(): WeightData {
  const store = useHydrationStore();
  const bleStore = useBottleStore();
  const demoStore = useDemoStore();

  if (store.demoMode) {
    const emptyW = store.emptyWeightG > 0 ? store.emptyWeightG : demoStore.emptyWeightG;
    const fullW = store.fullWeightG > 0 ? store.fullWeightG : emptyW + (Math.round(store.dailyGoalMl * 0.4 / 50) * 50 || 1000);
    const capacity = fullW - emptyW;
    const remaining = Math.max(0, Math.round(demoStore.simulatedWeight - emptyW));
    const fill = capacity > 0 ? Math.min(1, Math.max(0, remaining / capacity)) : 0;

    return {
      currentWeight: demoStore.simulatedWeight,
      isConnected: true,
      lastKnownWeight: demoStore.simulatedWeight,
      bottleState: demoStore.simulatedWeight > WEIGHT_THRESHOLD_G ? "on_scale" : "off_scale",
      batteryLevel: 100,
      waterRemainingMl: remaining,
      bottleCapacityMl: capacity,
      fillPercentage: fill,
      todayIntakeMl: demoStore.demoIntakeMl,
    };
  }

  const weight = bleStore.currentWeight;
  const connected = bleStore.isConnected;

  if (!connected) {
    return {
      currentWeight: null,
      isConnected: false,
      lastKnownWeight: null,
      bottleState: "disconnected",
      batteryLevel: null,
      waterRemainingMl: 0,
      bottleCapacityMl: store.getBottleCapacityMl(),
      fillPercentage: 0,
      todayIntakeMl: store.todayIntakeMl,
    };
  }

  const remaining = store.getWaterRemainingMl(weight);
  const capacity = store.getBottleCapacityMl();

  return {
    currentWeight: weight,
    isConnected: true,
    lastKnownWeight: weight,
    bottleState: weight !== null && weight > WEIGHT_THRESHOLD_G ? "on_scale" : "off_scale",
    batteryLevel: bleStore.batteryLevel,
    waterRemainingMl: remaining,
    bottleCapacityMl: capacity,
    fillPercentage: capacity > 0 ? Math.min(1, Math.max(0, remaining / capacity)) : 0,
    todayIntakeMl: store.todayIntakeMl,
  };
}
