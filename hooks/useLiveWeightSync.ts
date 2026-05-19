import { useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useBottleStore } from "../stores/bottleStore";
import { useHydrationStore } from "../stores/hydrationStore";
import { useAuthStore } from "../stores/authStore";

const THROTTLE_MS = 1000;
const MIN_DELTA_G = 2;

export function useLiveWeightSync(): void {
  const token = useAuthStore((s) => s.token);
  const currentWeight = useBottleStore((s) => s.currentWeight);
  const isConnected = useBottleStore((s) => s.isConnected);
  const activeBottleId = useHydrationStore((s) => s.activeBottleId);

  const updateLiveWeight = useMutation(
    (api as any).bottles.updateLiveWeight,
  );

  const lastSentAtRef = useRef<number>(0);
  const lastSentValueRef = useRef<number | null>(null);
  const inFlightRef = useRef<boolean>(false);

  useEffect(() => {
    if (!token || !activeBottleId || !isConnected) return;
    if (currentWeight === null || Number.isNaN(currentWeight)) return;
    if (inFlightRef.current) return;

    const now = Date.now();
    if (now - lastSentAtRef.current < THROTTLE_MS) return;

    if (
      lastSentValueRef.current !== null &&
      Math.abs(currentWeight - lastSentValueRef.current) < MIN_DELTA_G
    ) {
      return;
    }

    inFlightRef.current = true;
    lastSentAtRef.current = now;
    lastSentValueRef.current = currentWeight;

    void (async () => {
      try {
        await updateLiveWeight({
          token,
          bottleId: activeBottleId as any,
          weightG: currentWeight,
        });
      } catch (e) {
        console.warn("Live weight sync failed:", e);
      } finally {
        inFlightRef.current = false;
      }
    })();
  }, [currentWeight, isConnected, token, activeBottleId, updateLiveWeight]);
}
