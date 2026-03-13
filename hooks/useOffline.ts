import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuthStore } from "../stores/authStore";
import { offlineService } from "../services/offline";

interface OfflineState {
  isOnline: boolean;
  pendingActions: number;
  isSyncing: boolean;
  lastSyncResult: { synced: number; failed: number } | null;
}

export function useOffline() {
  const { token } = useAuthStore();
  const [state, setState] = useState<OfflineState>({
    isOnline: offlineService.isOnline,
    pendingActions: 0,
    isSyncing: false,
    lastSyncResult: null,
  });

  useEffect(() => {
    const unsubStatus = offlineService.onStatusChange((isOnline) => {
      setState((prev) => ({ ...prev, isOnline }));
    });

    const unsubSync = offlineService.onSync((result) => {
      setState((prev) => ({
        ...prev,
        pendingActions: result.pending,
        isSyncing: false,
        lastSyncResult: { synced: result.synced, failed: result.failed },
      }));
    });

    offlineService.getPendingCount().then((count) => {
      setState((prev) => ({ ...prev, pendingActions: count }));
    });

    return () => {
      unsubStatus();
      unsubSync();
    };
  }, []);

  const user = useQuery(api.auth.validateSession, token ? { token } : "skip");
  const todayStats = useQuery(api.stats.getToday, token ? { token } : "skip");
  const bottles = useQuery(api.bottles.list, token ? { token } : "skip");
  const beverages = useQuery(api.beverages.list, token ? { token } : "skip");
  const streak = useQuery(api.stats.getStreak, token ? { token } : "skip");

  const prevCacheKey = useRef("");
  useEffect(() => {
    if (!state.isOnline) return;

    const cacheKey = JSON.stringify({ user, todayStats, bottles, beverages, streak });
    if (cacheKey === prevCacheKey.current) return;
    prevCacheKey.current = cacheKey;

    const cachePayload: Record<string, any> = {};
    if (user) cachePayload.user = user;
    if (todayStats) cachePayload.todayStats = todayStats;
    if (bottles) cachePayload.bottles = bottles;
    if (beverages) cachePayload.beverages = beverages;
    if (streak) cachePayload.streak = streak;

    if (Object.keys(cachePayload).length > 0) {
      offlineService.cacheData(cachePayload);
    }
  }, [user, todayStats, bottles, beverages, streak, state.isOnline]);

  const logDrink = useCallback(
    async (args: {
      token: string;
      beverageTypeId: string;
      amountMl: number;
      isManual: boolean;
      bottleId?: string;
    }) => {
      const result = await offlineService.executeOrQueue("log_drink", args);
      if (!result.executed) {
        setState((prev) => ({
          ...prev,
          pendingActions: prev.pendingActions + 1,
        }));
      }
      return result;
    },
    []
  );

  const syncNow = useCallback(async () => {
    setState((prev) => ({ ...prev, isSyncing: true }));
    return offlineService.syncQueue();
  }, []);

  const getCachedData = useCallback(async () => {
    return offlineService.getCachedData();
  }, []);

  return {
    ...state,
    logDrink,
    syncNow,
    getCachedData,
    cachedUser: user,
    cachedTodayStats: todayStats,
    cachedBottles: bottles,
    cachedBeverages: beverages,
    cachedStreak: streak,
  };
}
