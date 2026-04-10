import { useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuthStore } from "../stores/authStore";
import { useBottleStore } from "../stores/bottleStore";
import { useHydrationStore } from "../stores/hydrationStore";
import { bluetoothService } from "../services/bluetooth";

export function useBleAutoConnect(): void {
  const token = useAuthStore((s) => s.token);
  const isHydrationLoaded = useHydrationStore((s) => s.isLoaded);
  const activeBottleId = useHydrationStore((s) => s.activeBottleId);
  const setActiveBottle = useHydrationStore((s) => s.setActiveBottle);
  const demoMode = useHydrationStore((s) => s.demoMode);
  const isConnected = useBottleStore((s) => s.isConnected);

  const bottles = useQuery(api.bottles.list, token ? { token } : "skip");

  const attemptedRef = useRef(false);

  useEffect(() => {
    attemptedRef.current = false;
  }, [token]);

  useEffect(() => {
    if (attemptedRef.current) return;
    if (!isHydrationLoaded) return;
    if (demoMode) return;
    if (!token) return;
    if (bottles === undefined) return;
    if (isConnected) return;

    const preferred =
      (activeBottleId &&
        bottles.find(
          (b: any) => b._id === activeBottleId && b.fullWeightG > 0,
        )) ||
      bottles.find(
        (b: any) => b.fullWeightG > 0 && b.bleDeviceId,
      ) ||
      bottles.find((b: any) => b.fullWeightG > 0) ||
      null;

    if (!preferred) {
      attemptedRef.current = true;
      return;
    }

    attemptedRef.current = true;

    (async () => {
      if (activeBottleId !== preferred._id) {
        try {
          await setActiveBottle({
            id: preferred._id,
            fullWeightG: preferred.fullWeightG,
            emptyWeightG: preferred.emptyWeightG,
            capacityMl: preferred.fullWeightG - preferred.emptyWeightG,
          });
        } catch (e) {
          console.warn("Failed to rehydrate active bottle from DB:", e);
        }
      }

      if (!preferred.bleDeviceId) return;

      try {
        await bluetoothService.connectAndStream(preferred.bleDeviceId);
      } catch (e) {
        console.log("BLE auto-reconnect skipped:", (e as Error)?.message);
      }
    })();
  }, [
    token,
    isHydrationLoaded,
    demoMode,
    bottles,
    isConnected,
    activeBottleId,
    setActiveBottle,
  ]);
}
