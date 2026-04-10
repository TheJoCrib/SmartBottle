import { useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useBottleStore } from "../stores/bottleStore";
import { useHydrationStore } from "../stores/hydrationStore";
import { useAuthStore } from "../stores/authStore";
import { offlineService } from "../services/offline";
import { detectConsumption, detectRefill } from "../utils/hydration";
import {
  CONSUMPTION_THRESHOLD_G,
  REFILL_THRESHOLD_G,
  OFF_SCALE_MARGIN_G,
} from "../constants";

const LOG_DEBOUNCE_MS = 5000;

const STABILITY_SAMPLES = 3;
const STABILITY_TOLERANCE_G = 3;

export function useHydration(): void {
  const currentWeight = useBottleStore((s) => s.currentWeight);
  const isConnected = useBottleStore((s) => s.isConnected);
  const setMeasuringDrink = useBottleStore((s) => s.setMeasuringDrink);
  const token = useAuthStore((s) => s.token);

  const activeBottleId = useHydrationStore((s) => s.activeBottleId);
  const emptyWeightG = useHydrationStore((s) => s.emptyWeightG);
  const isCalibrated = useHydrationStore((s) => s.isCalibrated);
  const demoMode = useHydrationStore((s) => s.demoMode);
  const addIntake = useHydrationStore((s) => s.addIntake);

  const beverages = useQuery(api.beverages.list, token ? { token } : "skip");
  const defaultBeverageId =
    beverages?.find((b: any) => b.name === "Water")?._id ||
    beverages?.[0]?._id ||
    null;

  const baselineRef = useRef<number | null>(null);
  const lastLogAtRef = useRef<number>(0);
  const processingRef = useRef(false);
  const wasOffScaleRef = useRef(false);
  const stableBufferRef = useRef<number[]>([]);

  useEffect(() => {
    baselineRef.current = null;
    wasOffScaleRef.current = false;
    stableBufferRef.current = [];
    setMeasuringDrink(false);
  }, [activeBottleId, setMeasuringDrink]);

  useEffect(() => {
    if (!isConnected) {
      baselineRef.current = null;
      wasOffScaleRef.current = false;
      stableBufferRef.current = [];
      setMeasuringDrink(false);
    }
  }, [isConnected, setMeasuringDrink]);

  useEffect(() => {
    if (demoMode) return;
    if (!isConnected || !isCalibrated) return;
    if (currentWeight === null) return;
    if (!token || !activeBottleId || !defaultBeverageId) return;
    if (processingRef.current) return;

    const curr = currentWeight;

    if (curr < emptyWeightG - OFF_SCALE_MARGIN_G) {
      wasOffScaleRef.current = true;
      stableBufferRef.current = [];
      setMeasuringDrink(true);
      return;
    }

    if (baselineRef.current === null) {
      baselineRef.current = curr;
      wasOffScaleRef.current = false;
      stableBufferRef.current = [];
      return;
    }

    if (!wasOffScaleRef.current) return;

    const buf = stableBufferRef.current;
    buf.push(curr);
    if (buf.length > STABILITY_SAMPLES) buf.shift();
    if (buf.length < STABILITY_SAMPLES) return;

    const min = Math.min(...buf);
    const max = Math.max(...buf);
    if (max - min > STABILITY_TOLERANCE_G) return;

    const sorted = [...buf].sort((a, b) => a - b);
    const analyzedWeight = sorted[Math.floor(sorted.length / 2)];
    wasOffScaleRef.current = false;
    stableBufferRef.current = [];
    setMeasuringDrink(false);

    const prev = baselineRef.current;

    if (detectRefill(prev, analyzedWeight, REFILL_THRESHOLD_G)) {
      baselineRef.current = analyzedWeight;
      return;
    }

    const consumed = detectConsumption(
      prev,
      analyzedWeight,
      CONSUMPTION_THRESHOLD_G,
    );
    if (consumed <= 0) return;

    const now = Date.now();
    if (now - lastLogAtRef.current < LOG_DEBOUNCE_MS) return;

    processingRef.current = true;
    (async () => {
      try {
        const d = new Date();
        const localDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        await offlineService.executeOrQueue("log_drink", {
          token,
          bottleId: activeBottleId,
          beverageTypeId: defaultBeverageId,
          amountMl: consumed,
          isManual: false,
          localDate,
        });
        await addIntake(consumed);
        lastLogAtRef.current = now;
        baselineRef.current = analyzedWeight;
      } catch (e) {
        console.error("Auto-log drink failed:", e);
      } finally {
        processingRef.current = false;
      }
    })();
  }, [
    currentWeight,
    isConnected,
    isCalibrated,
    demoMode,
    token,
    activeBottleId,
    emptyWeightG,
    defaultBeverageId,
    addIntake,
    setMeasuringDrink,
  ]);
}
