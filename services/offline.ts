import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import { ConvexReactClient } from "convex/react";
import { api } from "../convex/_generated/api";
import { FunctionReference } from "convex/server";

const OFFLINE_QUEUE_KEY = "smartbottle_offline_queue";
const OFFLINE_CACHE_KEY = "smartbottle_offline_cache";

const ACTION_MAP = {
  log_drink: api.drinks.log,
  update_profile: api.auth.updateProfile,
  create_bottle: api.bottles.create,
  update_bottle: api.bottles.update,
} as const;

type ActionType = keyof typeof ACTION_MAP;

interface QueuedAction {
  id: string;
  type: ActionType;
  payload: Record<string, any>;
  timestamp: number;
  retries: number;
}

interface OfflineCache {
  user?: any;
  bottles?: any[];
  todayStats?: any;
  beverages?: any[];
  streak?: any;
  lastUpdated: number;
}

type SyncCallback = (result: { synced: number; failed: number; pending: number }) => void;

class OfflineService {
  private _isOnline: boolean = true;
  private unsubscribe: (() => void) | null = null;
  private convexClient: ConvexReactClient | null = null;
  private isSyncing: boolean = false;
  private onSyncCallbacks: SyncCallback[] = [];
  private onStatusChangeCallbacks: ((isOnline: boolean) => void)[] = [];

  get isOnline(): boolean {
    return this._isOnline;
  }

  init(convexClient: ConvexReactClient): void {
    this.convexClient = convexClient;

    this.unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const wasOffline = !this._isOnline;
      this._isOnline = state.isConnected ?? false;

      this.onStatusChangeCallbacks.forEach((cb) => cb(this._isOnline));

      if (wasOffline && this._isOnline) {
        this.syncQueue();
      }
    });
  }

  cleanup(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.onSyncCallbacks = [];
    this.onStatusChangeCallbacks = [];
  }

  onStatusChange(callback: (isOnline: boolean) => void): () => void {
    this.onStatusChangeCallbacks.push(callback);
    return () => {
      this.onStatusChangeCallbacks = this.onStatusChangeCallbacks.filter(
        (cb) => cb !== callback
      );
    };
  }

  onSync(callback: SyncCallback): () => void {
    this.onSyncCallbacks.push(callback);
    return () => {
      this.onSyncCallbacks = this.onSyncCallbacks.filter((cb) => cb !== callback);
    };
  }

  async checkOnline(): Promise<boolean> {
    const state = await NetInfo.fetch();
    this._isOnline = state.isConnected ?? false;
    return this._isOnline;
  }

  async executeOrQueue(
    type: ActionType,
    payload: Record<string, any>
  ): Promise<{ executed: boolean; queueId?: string }> {
    if (this._isOnline && this.convexClient) {
      try {
        const mutation = ACTION_MAP[type] as FunctionReference<"mutation">;
        await this.convexClient.mutation(mutation, payload);
        return { executed: true };
      } catch (error: any) {
        if (this.isNetworkError(error)) {
          this._isOnline = false;
          this.onStatusChangeCallbacks.forEach((cb) => cb(false));
        } else {
          throw error;
        }
      }
    }

    const queueId = await this.queueAction(type, payload);
    return { executed: false, queueId };
  }

  private async queueAction(
    type: ActionType,
    payload: Record<string, any>
  ): Promise<string> {
    const queue = await this.getQueue();

    const action: QueuedAction = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      type,
      payload,
      timestamp: Date.now(),
      retries: 0,
    };

    queue.push(action);
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    return action.id;
  }

  async getQueue(): Promise<QueuedAction[]> {
    try {
      const data = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error reading offline queue:", error);
      return [];
    }
  }

  async getPendingCount(): Promise<number> {
    const queue = await this.getQueue();
    return queue.length;
  }

  async syncQueue(): Promise<{ synced: number; failed: number; pending: number }> {
    if (this.isSyncing || !this.convexClient || !this._isOnline) {
      const queue = await this.getQueue();
      return { synced: 0, failed: 0, pending: queue.length };
    }

    this.isSyncing = true;
    const queue = await this.getQueue();

    if (queue.length === 0) {
      this.isSyncing = false;
      return { synced: 0, failed: 0, pending: 0 };
    }

    let synced = 0;
    let failed = 0;
    const remainingQueue: QueuedAction[] = [];

    const sorted = [...queue].sort((a, b) => a.timestamp - b.timestamp);

    for (const action of sorted) {
      try {
        const mutation = ACTION_MAP[action.type] as FunctionReference<"mutation">;
        await this.convexClient.mutation(mutation, action.payload);
        synced++;
      } catch (error: any) {
        console.error(`Sync failed for ${action.type} (${action.id}):`, error);
        failed++;

        if (this.isNetworkError(error)) {
          this._isOnline = false;
          remainingQueue.push(action);
          const currentIndex = sorted.indexOf(action);
          remainingQueue.push(...sorted.slice(currentIndex + 1));
          break;
        }

        action.retries++;
        const isExpired = Date.now() - action.timestamp > 24 * 60 * 60 * 1000;
        const maxRetries = action.retries >= 3;

        if (!isExpired && !maxRetries) {
          remainingQueue.push(action);
        }
      }
    }

    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remainingQueue));
    this.isSyncing = false;

    const result = { synced, failed, pending: remainingQueue.length };
    this.onSyncCallbacks.forEach((cb) => cb(result));
    return result;
  }

  async cacheData(data: Partial<OfflineCache>): Promise<void> {
    try {
      const existing = await this.getCachedData();
      const updated: OfflineCache = {
        ...existing,
        ...data,
        lastUpdated: Date.now(),
      };
      await AsyncStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error("Error caching data:", error);
    }
  }

  async getCachedData(): Promise<OfflineCache | null> {
    try {
      const data = await AsyncStorage.getItem(OFFLINE_CACHE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Error reading cache:", error);
      return null;
    }
  }

  async clearAll(): Promise<void> {
    await Promise.all([
      AsyncStorage.removeItem(OFFLINE_QUEUE_KEY),
      AsyncStorage.removeItem(OFFLINE_CACHE_KEY),
    ]);
  }

  private isNetworkError(error: any): boolean {
    const message = (error?.message || "").toLowerCase();
    return (
      message.includes("network") ||
      message.includes("fetch") ||
      message.includes("timeout") ||
      message.includes("connection") ||
      message.includes("offline")
    );
  }
}

export const offlineService = new OfflineService();
