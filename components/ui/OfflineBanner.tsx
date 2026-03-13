import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface OfflineBannerProps {
  isOnline: boolean;
  pendingActions: number;
  isSyncing: boolean;
  onSyncPress?: () => void;
}

export function OfflineBanner({
  isOnline,
  pendingActions,
  isSyncing,
  onSyncPress,
}: OfflineBannerProps) {
  if (isOnline && pendingActions === 0) return null;

  if (isSyncing) {
    return (
      <View className="bg-primary-500 px-4 py-2 flex-row items-center justify-center">
        <Ionicons name="sync" size={14} color="#FFF" />
        <Text className="text-white text-xs font-medium ml-1.5">
          Syncing {pendingActions} action{pendingActions !== 1 ? "s" : ""}...
        </Text>
      </View>
    );
  }

  if (!isOnline) {
    return (
      <View className="bg-warning-500 px-4 py-2 flex-row items-center justify-center">
        <Ionicons name="cloud-offline" size={14} color="#FFF" />
        <Text className="text-white text-xs font-medium ml-1.5">
          You're offline
          {pendingActions > 0
            ? ` • ${pendingActions} action${pendingActions !== 1 ? "s" : ""} pending`
            : ""}
        </Text>
      </View>
    );
  }

  if (pendingActions > 0) {
    return (
      <TouchableOpacity
        className="bg-warning-100 dark:bg-warning-900 px-4 py-2 flex-row items-center justify-center"
        onPress={onSyncPress}
      >
        <Ionicons name="alert-circle" size={14} color="#F59E0B" />
        <Text className="text-warning-700 dark:text-warning-300 text-xs font-medium ml-1.5">
          {pendingActions} action{pendingActions !== 1 ? "s" : ""} pending — Tap to sync
        </Text>
      </TouchableOpacity>
    );
  }

  return null;
}
