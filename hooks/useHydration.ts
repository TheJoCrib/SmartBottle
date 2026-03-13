import { useEffect, useRef, useCallback } from "react";
import { useBottleStore } from "../stores/bottleStore";
import { useAuthStore } from "../stores/authStore";
import { offlineService } from "../services/offline";
import { detectConsumption, detectRefill } from "../utils/hydration";

const CONSUMPTION_THRESHOLD_G = 10;
const REFILL_THRESHOLD_G = 50;

interface UseHydrationOptions {
  bottleId?: string;
  emptyWeightG: number;
  fullWeightG: number;
  capacityMl: number;
  defaultBeverageTypeId?: string;
}

export function useHydration(options: UseHydrationOptions) {
  const { currentWeight, isConnected } = useBottleStore();
  const { token } = useAuthStore();

  const previousWeightRef = useRef<number | null>(null);
  const lastLogTimeRef = useRef<number>(0);
  const isProcessingRef = useRef(false);

  const { emptyWeightG, fullWeightG, capacityMl, bottleId, defaultBeverageTypeId } = options;

  const weight = currentWeight ?? 0;

  const waterWeightG = Math.max(0, weight - emptyWeightG);
  const maxWaterWeightG = fullWeightG - emptyWeightG;
  const waterLevelMl = maxWaterWeightG > 0
    ? Math.round((waterWeightG / maxWaterWeightG) * capacityMl)
    : 0;
  const waterLevelPercent = capacityMl > 0
    ? Math.min(100, Math.round((waterLevelMl / capacityMl) * 100))
    : 0;

  const processWeightChange = useCallback(async () => {
    if (!isConnected || !token || isProcessingRef.current || currentWeight === null) return;
    if (previousWeightRef.current === null) {
      previousWeightRef.current = currentWeight;
      return;
    }

    const now = Date.now();

    if (now - lastLogTimeRef.current < 5000) {
      previousWeightRef.current = currentWeight;
      return;
    }

    const consumed = detectConsumption(
      previousWeightRef.current,
      currentWeight,
      CONSUMPTION_THRESHOLD_G
    );

    if (consumed > 0 && defaultBeverageTypeId) {
      isProcessingRef.current = true;
      try {
        await offlineService.executeOrQueue("log_drink", {
          token,
          bottleId,
          beverageTypeId: defaultBeverageTypeId,
          amountMl: consumed,
          isManual: false,
        });
        lastLogTimeRef.current = now;
      } catch (error) {
        console.error("Auto-log failed:", error);
      } finally {
        isProcessingRef.current = false;
      }
    }

    detectRefill(
      previousWeightRef.current,
      currentWeight,
      REFILL_THRESHOLD_G
    );

    previousWeightRef.current = currentWeight;
  }, [currentWeight, isConnected, token, bottleId, defaultBeverageTypeId]);

  useEffect(() => {
    if (isConnected && currentWeight !== null && currentWeight > 0) {
      processWeightChange();
    }
  }, [currentWeight, isConnected, processWeightChange]);

  return {
    waterLevelMl,
    waterLevelPercent,
    currentWeightG: weight,
    isConnected,
  };
}
